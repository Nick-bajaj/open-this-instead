import React, { useEffect } from 'react';
import { Chessboard } from 'react-chessboard';

function ChessBoardComponent({ fen, onMove }) {
   const onPieceDrop = (sourceSquare, targetSquare) => {
       if(onMove){
          onMove(sourceSquare, targetSquare)
       }
     }

  useEffect(() =>{
       console.log("fen changed:", fen)
   }, [fen])
  return (
     <Chessboard
          position={fen}
          onPieceDrop={onPieceDrop}
          boardWidth={400}
        />
    );
  }
export default ChessBoardComponent;