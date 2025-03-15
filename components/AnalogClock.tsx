// components/AnalogClock.tsx
import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Line, G, Text as SvgText } from 'react-native-svg';

interface AnalogClockProps {
  size?: number;
  showSeconds?: boolean;
  darkMode?: boolean;
  hour?: number; // New parameter for hour
  minute?: number; // New parameter for minute
  showDigitalTime?: boolean;
}

export const AnalogClock: React.FC<AnalogClockProps> = ({
  size = 160,
  showSeconds = true,
  darkMode = true,
  hour = 8, // Default to 8
  minute = 15, // Default to 15
  showDigitalTime = true,
}) => {
  // Clock dimensions
  const center = size / 2;
  const radius = size / 2 - 10;
  const hourHandLength = radius * 0.5;
  const minuteHandLength = radius * 0.7;
  const secondHandLength = radius * 0.8;

  // Colors
  const clockFaceColor = darkMode ? '#2C3E50' : '#F5F5F5';
  const borderColor = darkMode ? '#FFFFFF' : '#333333';
  const hourMarkerColor = darkMode ? '#FFFFFF' : '#333333';
  const hourHandColor = darkMode ? '#FFFFFF' : '#333333';
  const minuteHandColor = darkMode ? '#FFFFFF' : '#333333';
  const secondHandColor = darkMode ? '#E74C3C' : '#E74C3C';
  const centerDotColor = darkMode ? '#FFFFFF' : '#333333';
  const textColor = darkMode ? '#FFFFFF' : '#333333';

  // Use the provided hour and minute values (normalized)
  const hours = hour % 12 || 12; // Convert 0 and 24 to 12
  const minutes = minute % 60;
  const seconds = 0;

  // Calculate hand angles
  // Hour hand: 30 degrees per hour + gradual movement based on minutes
  const hourAngle = ((hours % 12) + minutes / 60) * 30 - 90;
  // Minute hand: 6 degrees per minute
  const minuteAngle = minutes * 6 - 90;
  // Second hand: 6 degrees per second
  const secondAngle = seconds * 6 - 90;

  // Calculate hand coordinates
  const hourX = center + hourHandLength * Math.cos((hourAngle * Math.PI) / 180);
  const hourY = center + hourHandLength * Math.sin((hourAngle * Math.PI) / 180);

  const minuteX =
    center + minuteHandLength * Math.cos((minuteAngle * Math.PI) / 180);
  const minuteY =
    center + minuteHandLength * Math.sin((minuteAngle * Math.PI) / 180);

  const secondX =
    center + secondHandLength * Math.cos((secondAngle * Math.PI) / 180);
  const secondY =
    center + secondHandLength * Math.sin((secondAngle * Math.PI) / 180);

  // Generate hour markers
  const hourMarkers = [];
  for (let i = 0; i < 12; i++) {
    const angle = (i * 30 * Math.PI) / 180;
    const markerOuterRadius = radius - 2;
    const markerInnerRadius = i % 3 === 0 ? radius - 10 : radius - 5;
    const x1 = center + markerInnerRadius * Math.cos(angle);
    const y1 = center + markerInnerRadius * Math.sin(angle);
    const x2 = center + markerOuterRadius * Math.cos(angle);
    const y2 = center + markerOuterRadius * Math.sin(angle);

    hourMarkers.push(
      <Line
        key={i}
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={hourMarkerColor}
        strokeWidth={i % 3 === 0 ? 2 : 1}
      />,
    );

    // Add hour numbers
    if (i % 3 === 0) {
      const hourNum = i === 0 ? 12 : (i / 3) * 3;
      const numRadius = radius - 20;
      const numX = center + numRadius * Math.cos(angle);
      const numY = center + numRadius * Math.sin(angle);

      hourMarkers.push(
        <SvgText
          key={`num-${i}`}
          x={numX}
          y={numY + 4} // Adjust for text centering
          fontSize="12"
          fontWeight="bold"
          fill={textColor}
          textAnchor="middle"
        >
          {hourNum}
        </SvgText>,
      );
    }
  }

  // Format time for digital display
  const formatTime = (h: number, m: number) => {
    const formattedHour = h % 12 || 12; // Convert 0 to 12
    const amPm = h >= 12 ? 'PM' : 'AM';
    return `${formattedHour}:${m.toString().padStart(2, '0')} ${amPm}`;
  };

  return (
    <View style={{ width: size, height: size, margin: 10 }}>
      <Svg width={size} height={size}>
        {/* Clock face */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          fill={clockFaceColor}
          stroke={borderColor}
          strokeWidth={2}
        />

        {/* Hour markers */}
        {hourMarkers}

        {/* Hour hand */}
        <Line
          x1={center}
          y1={center}
          x2={hourX}
          y2={hourY}
          stroke={hourHandColor}
          strokeWidth={4}
          strokeLinecap="round"
        />

        {/* Minute hand */}
        <Line
          x1={center}
          y1={center}
          x2={minuteX}
          y2={minuteY}
          stroke={minuteHandColor}
          strokeWidth={3}
          strokeLinecap="round"
        />

        {/* Second hand */}
        {showSeconds && (
          <Line
            x1={center}
            y1={center}
            x2={secondX}
            y2={secondY}
            stroke={secondHandColor}
            strokeWidth={1.5}
            strokeLinecap="round"
          />
        )}

        {/* Center dot */}
        <Circle cx={center} cy={center} r={4} fill={centerDotColor} />

        {/* Add digital time display if enabled */}
        {showDigitalTime && (
          <SvgText
            x={center}
            y={center - radius / 2}
            fontSize="14"
            fontWeight="bold"
            fill={textColor}
            textAnchor="middle"
          >
            {formatTime(hour, minute)}
          </SvgText>
        )}
      </Svg>
    </View>
  );
};
