export const PREFFERED_DIMS_MAP = ["Small (858x480)", "Medium (1280x720)", "Large (1920x1080)"]

export default function DimensionSelector({ className, preferredDims, onChange }: { className?: string, preferredDims: number, onChange: (value: number) => void }) {

  return (
    <select className={className}
    value={preferredDims}
    onChange={(e) => {
		try {
			onChange(parseInt(e.target.value))
		} catch (e) {
			console.error(e)	
		}
	}}>
      {
        PREFFERED_DIMS_MAP.map((dim, i) =>  (<option key={i} value={i}>{dim}</option>))
      }
    </select>
  )
}