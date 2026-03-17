"use client";

interface SliderProps {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  label?: string;
  formatValue?: (value: number) => string;
  className?: string;
}

export function Slider({
  value,
  onChange,
  min,
  max,
  step = 1,
  label,
  formatValue,
  className,
}: SliderProps) {
  const displayValue = formatValue ? formatValue(value) : String(value);

  return (
    <div className={className}>
      {(label || formatValue) && (
        <div className="mb-2 flex items-center justify-between text-sm">
          {label && <span className="font-medium text-foreground">{label}</span>}
          <span className="text-muted-foreground">{displayValue}</span>
        </div>
      )}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full cursor-pointer accent-primary"
      />
    </div>
  );
}
