import { profile } from '@/data/site'
import { cn, displayFont } from '@/lib/utils'

// Instrument Serif draws "1" almost like "l", so digits in the nick use Noto Serif Display's clearer figures.
export function Logo({ className, asSpan = false }: { className?: string; asSpan?: boolean }) {
  const Tag = asSpan ? 'span' : 'a'
  return (
    <Tag
      {...(asSpan ? {} : { href: '#top' })}
      className={cn('tracking-tight text-foreground', className)}
      style={displayFont}
    >
      {profile.nick.split(/(\d)/).map((part, i) =>
        /\d/.test(part) ? (
          <span key={i} style={{ fontFamily: "'Noto Serif Display', serif" }}>
            {part}
          </span>
        ) : (
          part
        ),
      )}
      <sup className="text-xs">®</sup>
    </Tag>
  )
}
