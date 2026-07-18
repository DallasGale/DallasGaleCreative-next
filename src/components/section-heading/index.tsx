interface Props {
  heading: string
  id: string
}
const SectionHeading = (props: Props) => {
  const {heading, id} = props
  return (
    <div
      id={id}
      className="section sticky top-[80px] z-2 mx-auto mb-0 flex w-full border-b border-white pl-5 backdrop-blur-md md:mb-0 md:grid-cols-[1fr_2fr]"
    >
      <div>
        <h2 className="relative inline-block text-[30px] leading-tight font-extrabold">
          {heading}
        </h2>
      </div>
    </div>
  )
}
export default SectionHeading
