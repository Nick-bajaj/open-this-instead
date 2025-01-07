import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import ChessBoardComponent from './components/Chessboard';
import { Circles } from 'react-loader-spinner';
import './App.css'; // Import the CSS file

function App() {
    const [gameUrl, setGameUrl] = useState('');
    const [analysisData, setAnalysisData] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
    const boardRef = useRef(null);
    const [moveListTop, setMoveListTop] = useState(0);
    const [evaluationPercentage, setEvaluationPercentage] = useState(50);
     const [boardWidth, setBoardWidth] = useState(0);

    const getEvaluation = () => {
        if (analysisData) {
            return analysisData[currentMoveIndex].score;
        }
        return 'Not yet analyzed';
    };

    const handleInputChange = (e) => {
        setGameUrl(e.target.value);
    };

    useEffect(() => {
        if (boardRef.current) {
            const boardRect = boardRef.current.getBoundingClientRect();
            setMoveListTop(boardRect.top);
           setBoardWidth(boardRect.width)
        }
    }, [analysisData]);

    useEffect(() => {
        if (analysisData) {
            const evalScore = getEvaluation();
            if (evalScore === 'Not yet analyzed') {
                setEvaluationPercentage(50);
                return;
            }
            const percentage = Math.min(Math.max((evalScore + 1000) / 2000, 0), 1) * 100;
            setEvaluationPercentage(percentage);
        }
    }, [currentMoveIndex, analysisData, getEvaluation]);


    const handleAnalyze = async () => {
        setLoading(true);
        setAnalysisData(null);
        setError(null);
        try {
            const response = await axios.post('http://127.0.0.1:5000/analyze', {
                gameUrl: gameUrl,
            });
            setAnalysisData(response.data.analysis);
            setCurrentMoveIndex(0);
        } catch (error) {
            setError(error.message || 'An error occurred during analysis.');
        } finally {
            setLoading(false);
        }
    };

    const handleNextMove = () => {
        if (analysisData && currentMoveIndex < analysisData.length - 1) {
            setCurrentMoveIndex(currentMoveIndex + 1);
        }
    };

    const handlePreviousMove = () => {
        if (analysisData && currentMoveIndex > 0) {
            setCurrentMoveIndex(currentMoveIndex - 1);
        }
    };

    const onMove = (sourceSquare, targetSquare) => {
        console.log('Move made', sourceSquare, targetSquare);
    };

    const getBestMove = () => {
        if (analysisData && analysisData[currentMoveIndex].best_move) {
            return analysisData[currentMoveIndex].best_move;
        }
        return 'Not yet analyzed';
    };

    const getCurrentFen = () => {
        if (analysisData) {
            return analysisData[currentMoveIndex].fen;
        }
        return 'start';
    };

    const getMoves = () => {
        if (analysisData) {
            const moves = [];
            for (let i = 0; i < analysisData.length; i += 2) {
                const whiteMove = analysisData[i];
                const blackMove = analysisData[i + 1];
                const moveNumber = Math.floor(i / 2) + 1;
                const moveElement = (
                    <div
                        key={i}
                        style={{
                            display: 'flex',
                            justifyContent: 'flex-start',
                            marginBottom: '2px',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        <span style={{ fontWeight: currentMoveIndex === i ? 'bold' : 'normal', minWidth: '15px' }}>
                            {' '}
                            {moveNumber}.
                        </span>
                        <span
                            style={{
                                marginLeft: '5px',
                                fontWeight: currentMoveIndex === i ? 'bold' : 'normal',
                                minWidth: '30px',
                            }}
                        >
                            {whiteMove.move}
                        </span>
                        <span
                            style={{
                                marginLeft: '15px',
                                fontWeight: blackMove && currentMoveIndex === i + 1 ? 'bold' : 'normal',
                                minWidth: '30px',
                            }}
                        >
                            {blackMove ? blackMove.move : null}
                        </span>
                    </div>
                );
                moves.push(moveElement);
            }
            return moves;
        }
        return [];
    };

    return (
        <div className="app-container">
            <div className="input-area">
                <input
                    type="text"
                    placeholder="Enter PGN URL"
                    value={gameUrl}
                    onChange={handleInputChange}
                />
                <button onClick={handleAnalyze} className="analyze-button" disabled={loading}>
                    Analyze
                </button>
            </div>
            <div className="progress-bar-container">
                <div className="progress-bar" style={{ width: `${evaluationPercentage}%` }}></div>
            </div>
            {loading && (
                <div className="loading-overlay">
                    <Circles
                        height="80"
                        width="80"
                        color="#4fa94d"
                        ariaLabel="circles-loading"
                        wrapperStyle={{}}
                        wrapperClass=""
                        visible={true}
                    />
                </div>
            )}
            {error && <p className="error">{error}</p>}
            {analysisData && (
                <div className="content-container">
                     <div className="navigation-buttons">
                         <button onClick={handlePreviousMove} disabled={currentMoveIndex <= 0}>
                            previous
                          </button>
                         <button onClick={handleNextMove} disabled={currentMoveIndex >= analysisData.length - 1}>
                            next
                         </button>
                    </div>
                     <div className="chessboard-container" ref={boardRef}>
                        <ChessBoardComponent fen={getCurrentFen()} onMove={onMove} />
                     </div>
                     <div className="evaluation-best-move">
                       <div className="evaluation-panel">
                           <span className="panel-label">EVALUATION</span>
                            {getEvaluation()}
                        </div>
                        <div className="best-move-panel">
                            <span className="panel-label">BEST MOVE</span>
                           {getBestMove()}
                       </div>
                     </div>
                    <div className="move-list-container" style={{ top: moveListTop }}>
                        <div className="move-list-header">
                            <span style={{ marginRight: '5px' }}>PLAYER MOVES</span>
                            <span className="eye-icon">👁️</span>
                        </div>
                        {getMoves()}
                    </div>
                </div>
            )}
        </div>
    );
}

export default App;