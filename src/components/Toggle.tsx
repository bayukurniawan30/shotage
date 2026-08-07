import React, { type ReactNode } from 'react';
import { Switch as AriaSwitch, type SwitchProps as AriaSwitchProps } from 'react-aria-components';
import { cx } from '../utils/cx';

interface ToggleBaseProps {
  size?: 'sm' | 'md';
  slim?: boolean;
  className?: string;
  isHovered?: boolean;
  isFocusVisible?: boolean;
  isSelected?: boolean;
  isDisabled?: boolean;
}

export const ToggleBase = ({
  className,
  isHovered,
  isDisabled,
  isFocusVisible,
  isSelected,
  slim,
  size = 'sm',
}: ToggleBaseProps) => {
  const styles = {
    default: {
      sm: {
        root: 'h-5 w-9 p-0.5',
        switch: cx('size-4', isSelected && 'translate-x-4'),
      },
      md: {
        root: 'h-6 w-11 p-0.5',
        switch: cx('size-5', isSelected && 'translate-x-5'),
      },
    },
    slim: {
      sm: {
        root: 'h-4 w-8',
        switch: cx('size-4', isSelected && 'translate-x-4'),
      },
      md: {
        root: 'h-5 w-10',
        switch: cx('size-5', isSelected && 'translate-x-5'),
      },
    },
  };

  const classes = slim ? styles.slim[size] : styles.default[size];

  return (
    <div
      className={cx(
        'cursor-pointer rounded-full bg-neutral-800 ring-[0.5px] ring-neutral-700 transition duration-150 ease-linear ring-inset relative flex items-center shrink-0',
        isSelected && 'bg-pastel-pink',
        isSelected && isHovered && 'bg-pastel-pink/90',
        isDisabled && 'cursor-not-allowed opacity-50',
        isFocusVisible && 'outline-2 outline-offset-2 outline-pastel-pink',

        slim && 'ring-1',
        slim && isSelected && 'ring-transparent',
        classes.root,
        className
      )}
    >
      <div
        style={{
          transition:
            'transform 0.15s ease-in-out, translate 0.15s ease-in-out, border-color 0.1s linear, background-color 0.1s linear',
        }}
        className={cx(
          'rounded-full bg-white shadow-sm transition-transform duration-150 ease-in-out',

          slim && 'shadow-xs border border-neutral-700',

          classes.switch
        )}
      />
    </div>
  );
};

const styles = {
  sm: {
    root: 'gap-2',
    textWrapper: '',
    label: 'text-xs font-semibold text-slate-300',
    hint: 'text-[11px] text-slate-400',
  },
  md: {
    root: 'gap-3',
    textWrapper: 'gap-0.5',
    label: 'text-sm font-semibold text-slate-200',
    hint: 'text-xs text-slate-400',
  },
};

interface ToggleProps extends AriaSwitchProps {
  size?: 'sm' | 'md';
  label?: string;
  hint?: ReactNode;
  slim?: boolean;
}

export const Toggle = ({ label, hint, className, size = 'sm', slim, ...ariaSwitchProps }: ToggleProps) => {
  return (
    <AriaSwitch
      {...ariaSwitchProps}
      className={(state) =>
        cx(
          'relative flex w-max items-center cursor-pointer select-none',
          state.isDisabled && 'cursor-not-allowed',
          styles[size].root,
          typeof className === 'function' ? className(state) : className
        )
      }
    >
      {({ isSelected, isDisabled, isFocusVisible, isHovered }) => (
        <>
          <ToggleBase
            slim={slim}
            size={size}
            isHovered={isHovered}
            isDisabled={isDisabled}
            isFocusVisible={isFocusVisible}
            isSelected={isSelected}
            className={slim ? 'mt-0.5' : ''}
          />

          {(label || hint) && (
            <div className={cx('flex flex-col', styles[size].textWrapper)}>
              {label && <p className={cx('text-slate-300 select-none', styles[size].label)}>{label}</p>}
              {hint && (
                <span className={cx('text-slate-400', styles[size].hint)} onClick={(event) => event.stopPropagation()}>
                  {hint}
                </span>
              )}
            </div>
          )}
        </>
      )}
    </AriaSwitch>
  );
};
