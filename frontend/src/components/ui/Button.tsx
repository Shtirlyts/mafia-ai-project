import { FC, MouseEventHandler, PropsWithChildren } from "react";

interface ButtonProps extends Required<PropsWithChildren> {
  onClick: MouseEventHandler<HTMLButtonElement>;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'outline';
  className?: string;
}

export const Button: FC<ButtonProps> = ({ children, onClick, disabled = false, variant = 'primary', className = '' }) => {
  const baseStyle = "px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2";
  const variants = {
    primary: "bg-red-600 hover:bg-red-700 text-white disabled:bg-gray-700 disabled:text-gray-400",
    secondary: "bg-gray-800 hover:bg-gray-700 text-white disabled:bg-gray-800",
    outline: "border border-gray-600 hover:border-gray-400 text-gray-300"
  };
  return (
    <button onClick={onClick} disabled={disabled} className={`${baseStyle} ${variants[variant as keyof typeof variants]} ${className}`}>
      {children}
    </button>
  );
};
