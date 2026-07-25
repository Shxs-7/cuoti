interface Props {
  text: string;
  color?: string;
  onClick?: () => void;
}

export function Badge({ text, color = '#3b82f6', onClick }: Props) {
  return (
    <span
      className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-opacity-10 text-current ${onClick ? 'cursor-pointer active:opacity-70' : ''}`}
      style={{ backgroundColor: color + '1A', color }}
      onClick={onClick}
    >
      {text}
    </span>
  );
}
