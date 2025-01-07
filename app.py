import logging
import chess
import chess.pgn
import chess.engine
import requests
from flask import Flask, request, jsonify
from flask_cors import CORS
import io
import os

app = Flask(__name__)
CORS(app)

# Configure logging
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')
# Get Stockfish path from an environment variable, defaulting to a suitable path if not set
STOCKFISH_PATH = os.environ.get("STOCKFISH_PATH", r"C:\\Users\\hp\\OneDrive\\Desktop\\stockfish\\stockfish1.exe")

def get_stockfish_engine():
    """ Initialize and return the stockfish engine."""
    try:
        engine = chess.engine.SimpleEngine.popen_uci(STOCKFISH_PATH)
        return engine
    except FileNotFoundError:
        raise FileNotFoundError(f"Stockfish executable not found at {STOCKFISH_PATH}")

def fetch_pgn_from_url(game_url):
    """Fetches PGN data from a URL."""
    try:
        response = requests.get(game_url)
        response.raise_for_status()  # Raise HTTPError for bad responses (4xx or 5xx)
        return response.text
    except requests.exceptions.RequestException as e:
        raise Exception(f"Unable to fetch game data: {e}")


def parse_pgn_data(pgn_text):
    """Parses the PGN data and returns a chess game object."""
    try:
        pgn_io = io.StringIO(pgn_text)
        game = chess.pgn.read_game(pgn_io)
        if not game:
            raise Exception("No game found in the pgn data")
        return game
    except Exception as e:
         raise Exception(f"Failed to parse PGN data: {e}")

def analyze_position(board, engine, time_limit=0.1):
    """ Analyzes a given position."""
    try:
        info = engine.analyse(board, chess.engine.Limit(time=time_limit))
        score = info["score"].relative.score(mate_score=1000)
        best_move = info.get("pv", [None])[0]  # Get best move from analysis
        return {
                "score": score,
                "best_move": best_move.uci() if best_move else None
            }
    except Exception as e:
        logging.error(f"Error during engine analysis: {e}")
        return {"error": f"Engine analysis failed: {e}"}

def analyze_game(game, engine):
    """Analyzes a chess game and returns move analysis."""
    move_analysis = []
    board = game.board()
    for move in game.mainline_moves():
            board.push(move)
            analysis_results = analyze_position(board, engine)
            if "error" in analysis_results:
               return {"error": analysis_results["error"]}
            move_analysis.append({
                "move": move.uci(),
                "score": analysis_results["score"],
                "best_move": analysis_results["best_move"],
                "fen": board.fen()
            })
    return move_analysis


@app.route('/analyze', methods=['POST'])
def analyze():
    data = request.get_json()
    game_url = data.get('gameUrl') #This should match the frontend!
    if not game_url:
        logging.error("Game URL is required")
        return jsonify({"message": "Game URL is required"}), 400

    try:
         game_pgn = fetch_pgn_from_url(game_url)
         game = parse_pgn_data(game_pgn)
    except Exception as e:
         logging.error(f"Failed to fetch or parse PGN data: {e}")
         return jsonify({"message": str(e)}), 400

    try:
       with get_stockfish_engine() as engine:
           analysis = analyze_game(game, engine)
           if "error" in analysis:
              return jsonify({"error": analysis["error"]}), 500
    except FileNotFoundError as e:
        return jsonify({"error": str(e)}), 500
    except Exception as e:
         logging.error(f"Unexpected error during analysis: {e}")
         return jsonify({"message": f"Unexpected error during analysis: {e}"}), 500

    result = {
        "message": "Analysis done",
        "url": game_url,
        "analysis": analysis
    }
    return jsonify(result)

if __name__ == '__main__':
    app.run(debug=True, port=5000)