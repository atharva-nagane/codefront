const Skeleton = ({ width = '100%', height = '1rem', borderRadius = '4px', style = {} }) => {
  return (
    <div style={{
      width,
      height,
      borderRadius,
      background: 'linear-gradient(90deg, #1a1a1a 25%, #222 50%, #1a1a1a 75%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.5s infinite',
      ...style,
    }} />
  )
}

export const SkeletonRow = ({ cols = 4 }) => (
  <tr>
    {Array(cols).fill(0).map((_, i) => (
      <td key={i} style={{ padding: '1rem 1.25rem' }}>
        <Skeleton height="0.85rem" width={i === 0 ? '2rem' : i === 1 ? '60%' : '4rem'} />
      </td>
    ))}
  </tr>
)

export const SkeletonText = ({ lines = 3 }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
    {Array(lines).fill(0).map((_, i) => (
      <Skeleton
        key={i}
        height="0.85rem"
        width={i === lines - 1 ? '60%' : '100%'}
      />
    ))}
  </div>
)

export const SkeletonCard = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1.5rem', background: '#111', borderRadius: '8px', border: '1px solid #1a1a1a' }}>
    <Skeleton height="1.5rem" width="40%" />
    <Skeleton height="0.85rem" width="20%" />
    <SkeletonText lines={4} />
  </div>
)

export default Skeleton