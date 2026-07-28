interface RatingProps {
  rating: number;
  reviewCount: number;
  size?: 'sm' | 'md' | 'lg';
}

function StarIcon({ filled, half, size }: { filled: boolean; half: boolean; size: number }) {
  const color = filled || half ? '#F59E0B' : '#D1D5DB';

  if (half) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="halfFill">
            <stop offset="50%" stopColor="#F59E0B" />
            <stop offset="50%" stopColor="#D1D5DB" />
          </linearGradient>
        </defs>
        <path
          d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
          fill="url(#halfFill)"
        />
      </svg>
    );
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={color}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

export function Rating({ rating, reviewCount, size = 'sm' }: RatingProps) {
  const sizeMap = { sm: 14, md: 18, lg: 22 };
  const iconSize = sizeMap[size];
  const textSize = size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : 'text-base';

  const stars = [];
  for (let i = 1; i <= 5; i++) {
    const filled = i <= Math.floor(rating);
    const half = !filled && i === Math.ceil(rating) && rating % 1 >= 0.25;
    stars.push(
      <StarIcon key={i} filled={filled} half={half} size={iconSize} />
    );
  }

  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center gap-0.5">{stars}</div>
      <span className={`font-medium text-muted-foreground ${textSize}`}>
        {rating.toFixed(1)}
      </span>
      {size !== 'sm' && (
        <span className={`text-muted-foreground ${textSize}`}>
          ({reviewCount} reviews)
        </span>
      )}
    </div>
  );
}
