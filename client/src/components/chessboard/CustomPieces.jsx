import { defaultPieces } from "react-chessboard";

export const customPieces = {
  ...defaultPieces,

  // all the custom pieces and there logic resides here

  wP: (props) => {
    if (props?.square === "e2") {
      return (
        <svg viewBox="0 0 24 24" fill="white">
          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
        </svg>
      );
    }

    return (
      <svg
        viewBox="0 0 45 45"
        width="100%"
        height="100%"
        style={props?.svgStyle}
      >
        <path
          d="m 22.5,9 c -2.21,0 -4,1.79 -4,4 0,0.89 0.29,1.71 0.78,2.38 C 17.33,16.5 16,18.59 16,21 c 0,2.03 0.94,3.84 2.41,5.03 C 15.41,27.09 11,31.58 11,39.5 H 34 C 34,31.58 29.59,27.09 26.59,26.03 28.06,24.84 29,23.03 29,21 29,18.59 27.67,16.5 25.72,15.38 26.21,14.71 26.5,13.89 26.5,13 c 0,-2.21 -1.79,-4 -4,-4 z"
          fill={props?.fill ?? "#ffffff"}
          stroke="#000"
          strokeWidth="1.5"
        />
      </svg>
    );
  },

  bK: (props) => (
    <svg viewBox="0 0 24 24" fill="black">
      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
    </svg>
  ),
};
