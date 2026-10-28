import React from 'react';
import Svg, {
  Circle,
  Defs,
  G,
  LinearGradient,
  Path,
  Rect,
  Stop,
} from 'react-native-svg';

type QuizzyLogoProps = {
  size?: number;
};

/**
 * The Quizzy mark: a rounded app tile in the app's blue-to-green accents.
 *
 * Inside sits a ring with a tick and a short tail, so the ring reads as a Q and
 * the tick reads as a right answer. The tail leaves the ring at its own
 * lower-right tangent and stops well short of the tile edge, which keeps the
 * silhouette a Q rather than a magnifying glass.
 */
export const QuizzyLogo: React.FC<QuizzyLogoProps> = ({ size = 96 }) => (
  <Svg width={size} height={size} viewBox="0 0 120 120">
    <Defs>
      <LinearGradient id="quizzyTile" x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0" stopColor="#2e96c2" />
        <Stop offset="1" stopColor="#34d399" />
      </LinearGradient>
    </Defs>

    <Rect
      x="4"
      y="4"
      width="112"
      height="112"
      rx="30"
      fill="url(#quizzyTile)"
    />

    {/* Nudged down so the ring-plus-tail group sits optically, not
        mathematically, centred in the tile. */}
    <G transform="translate(0, 4)">
      <Circle
        cx="58"
        cy="54"
        r="25"
        fill="none"
        stroke="#ffffff"
        strokeWidth="10"
      />

      {/* The tick fills the ring, so it survives at small sizes. */}
      <Path
        d="M47 55 L56 64 L71 43"
        fill="none"
        stroke="#ffffff"
        strokeWidth="9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* The tail: leaves the ring where it already points, and stops short. */}
      <Path
        d="M69 65 L82 78"
        fill="none"
        stroke="#ffffff"
        strokeWidth="10"
        strokeLinecap="round"
      />
    </G>
  </Svg>
);

export default QuizzyLogo;
