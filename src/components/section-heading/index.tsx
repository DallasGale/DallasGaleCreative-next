interface Props {
  heading: string
  id: string
}
const SectionHeading = (props: Props) => {
  const {heading, id} = props
  return (
    <div
      id={id}
      className="section sticky top-[70px] left-5 z-30 mx-auto mb-0 flex inline-block w-auto border-1 border-white bg-white p-2 px-4 text-black md:mb-0 md:grid-cols-[1fr_2fr]"
    >
      <div>
        <h2 className="relative inline-block text-sm leading-tight font-extrabold">
          {heading}
        </h2>
      </div>
    </div>
  )
}
export default SectionHeading
