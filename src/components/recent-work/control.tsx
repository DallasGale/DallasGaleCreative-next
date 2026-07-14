import {ChevronBack, ChevronForward} from "../icons"

interface Props {
  onClick: () => void
  disabled: boolean
  direction: "previous" | "next"
}

const Control = (props: Props) => {
  const {onClick, disabled, direction} = props
  return (
    <button
      type="button"
      aria-label={`${direction} project`}
      onClick={onClick}
      disabled={disabled}
      className=" flex h-11 w-11 items-center justify-center  border border-white/20 text-lg leading-none transition-all hover:border-white/60 hover:bg-white/5 active:scale-95 disabled:opacity-30 disabled:hover:border-white/20 disabled:hover:bg-transparent hover:shadow-[-5px_6px_0_0_var(--hover-shadow)] disabled:hover:shadow-none"
    >
      {direction === "previous" && <ChevronBack />}
      {direction === "next" && <ChevronForward />}
    </button>
  )
}

export default Control
