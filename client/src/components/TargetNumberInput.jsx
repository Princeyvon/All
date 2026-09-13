import React, { useState, useEffect } from "react";
import { Plus, Minus } from "lucide-react";

/**
 * Custom-designed target number input field.
 * - Zero browser spinner arrows / flows
 * - No accidental mouse wheel changes
 * - Tactile minus and plus increment buttons
 * - Quick delta preset chips (+1.25, +2.5, +5)
 * - Decimal precision handling without input jumping or NaN
 * - Bodyweight (0 kg) indicator
 */
export function TargetNumberInput({
  value,
  onChange,
  step = 2.5,
  min = 0,
  max = 400,
  unit = "kg",
  exerciseName = "exercise",
  size = "md", // "sm" | "md"
  showQuickPills = true,
  disabled = false,
}) {
  const [localStr, setLocalStr] = useState(
    value === 0 ? "0" : value ? String(value) : ""
  );
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!isFocused) {
      setLocalStr(value === 0 ? "0" : value ? String(value) : "");
    }
  }, [value, isFocused]);

  const numVal = parseFloat(localStr) || 0;

  const handleStep = (delta) => {
    if (disabled) return;
    const current = parseFloat(localStr) || 0;
    const next = Math.max(min, Math.min(max, Math.round((current + delta) * 10) / 10));
    setLocalStr(String(next));
    onChange(next);
  };

  const handleInputChange = (e) => {
    const raw = e.target.value;
    // Allow numbers, period, and comma
    if (/^[0-9]*[.,]?[0-9]*$/.test(raw) || raw === "") {
      const normalized = raw.replace(",", ".");
      setLocalStr(normalized);
      const parsed = parseFloat(normalized);
      if (!isNaN(parsed) && parsed >= min && parsed <= max) {
        onChange(parsed);
      } else if (normalized === "") {
        onChange(0);
      }
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    const parsed = parseFloat(localStr);
    if (isNaN(parsed) || parsed < min) {
      setLocalStr(String(min));
      onChange(min);
    } else {
      const clamped = Math.min(max, Math.round(parsed * 10) / 10);
      setLocalStr(String(clamped));
      onChange(clamped);
    }
  };

  const isSmall = size === "sm";

  return (
    <div className="flex flex-col items-end gap-1 select-none">
      {/* Precision Number Pod */}
      <div
        className={`flex items-center gap-1 bg-[#12131A] border transition-all rounded-xl p-1 shadow-inner ${
          isFocused
            ? "border-teal-400/90 ring-1 ring-teal-400/20"
            : "border-stone-700/80 hover:border-stone-600"
        } ${disabled ? "opacity-40 pointer-events-none" : ""}`}
      >
        {/* Decrement Button */}
        <button
          type="button"
          onClick={() => handleStep(-step)}
          disabled={disabled || numVal <= min}
          aria-label={`Decrease weight for ${exerciseName}`}
          className={`${
            isSmall ? "w-6 h-6" : "w-7 h-7 sm:w-8 sm:h-8"
          } rounded-lg bg-stone-800/90 hover:bg-stone-700 active:scale-95 text-stone-200 hover:text-white flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shrink-0`}
        >
          <Minus size={isSmall ? 11 : 13} strokeWidth={2.5} />
        </button>

        {/* Input Field without any browser arrows or layout flows */}
        <div
          className={`flex items-center justify-center ${
            isSmall ? "min-w-[56px] px-1" : "min-w-[66px] sm:min-w-[76px] px-1.5"
          }`}
        >
          <input
            type="text"
            inputMode="decimal"
            pattern="[0-9]*[.,]?[0-9]*"
            value={localStr}
            onFocus={() => setIsFocused(true)}
            onBlur={handleBlur}
            onChange={handleInputChange}
            onWheel={(e) => e.currentTarget.blur()}
            disabled={disabled}
            className={`${
              isSmall ? "w-10 text-xs" : "w-12 sm:w-14 text-sm sm:text-base"
            } text-center font-mono font-black text-white tabular-nums bg-transparent border-none outline-none p-0 selection:bg-teal-500/30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
          />
          <span
            className={`${
              isSmall ? "text-[9px]" : "text-[10px] sm:text-[11px]"
            } font-bold text-teal-400/80 ml-0.5 uppercase tracking-wider shrink-0 select-none`}
          >
            {unit}
          </span>
        </div>

        {/* Increment Button */}
        <button
          type="button"
          onClick={() => handleStep(step)}
          disabled={disabled || numVal >= max}
          aria-label={`Increase weight for ${exerciseName}`}
          className={`${
            isSmall ? "w-6 h-6" : "w-7 h-7 sm:w-8 sm:h-8"
          } rounded-lg bg-stone-800/90 hover:bg-stone-700 active:scale-95 text-stone-200 hover:text-white flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shrink-0`}
        >
          <Plus size={isSmall ? 11 : 13} strokeWidth={2.5} />
        </button>
      </div>

      {/* Quick Jump Micro-Pills */}
      {showQuickPills && !disabled && (
        <div className="flex items-center gap-1 text-[10px] text-stone-400">
          {numVal === 0 ? (
            <span className="px-1.5 py-0.5 rounded-md bg-stone-800 text-stone-300 font-semibold text-[10px]">
              Bodyweight
            </span>
          ) : (
            <button
              type="button"
              onClick={() => handleStep(-2.5)}
              className="px-1.5 py-0.5 rounded-md bg-stone-800/80 hover:bg-stone-700 text-stone-300 hover:text-white transition-colors cursor-pointer font-mono font-medium"
            >
              -2.5
            </button>
          )}
          <button
            type="button"
            onClick={() => handleStep(1.25)}
            className="px-1.5 py-0.5 rounded-md bg-stone-800/80 hover:bg-stone-700 text-stone-300 hover:text-white transition-colors cursor-pointer font-mono font-medium"
          >
            +1.25
          </button>
          <button
            type="button"
            onClick={() => handleStep(2.5)}
            className="px-1.5 py-0.5 rounded-md bg-stone-800/80 hover:bg-stone-700 text-stone-300 hover:text-white transition-colors cursor-pointer font-mono font-medium"
          >
            +2.5
          </button>
          <button
            type="button"
            onClick={() => handleStep(5)}
            className="px-1.5 py-0.5 rounded-md bg-stone-800/80 hover:bg-stone-700 text-stone-300 hover:text-white transition-colors cursor-pointer font-mono font-medium"
          >
            +5
          </button>
        </div>
      )}
    </div>
  );
}
