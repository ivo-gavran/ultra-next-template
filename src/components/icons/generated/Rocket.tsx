import type { SVGProps } from "react";
interface SVGRProps {
  title?: string;
  titleId?: string;
}
const SvgRocket = ({
  title,
  titleId,
  ...props
}: SVGProps<SVGSVGElement> & SVGRProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    width="1em"
    height="1em"
    aria-labelledby={titleId}
    {...props}
  >
    {title ? <title id={titleId}>{title}</title> : null}
    <path
      stroke="currentColor"
      strokeLinejoin="round"
      strokeWidth={1.8}
      d="M14.5 5.5c2.2-2.2 4.8-2.6 6-2.5.1 1.2-.3 3.8-2.5 6l-4 4-3-3z"
    />
    <path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.8}
      d="m10.5 10.5-4.7.7-2.3 2.3L9 14.6m4.5-1.1-.7 4.7-2.3 2.3L9.4 15"
    />
    <circle cx={16.5} cy={7} r={1.5} fill="currentColor" />
    <path
      fill="currentColor"
      d="M6.5 17.5c-1.3.2-2.8 1.7-3 3 1.3-.2 2.8-.5 3.7-1.3.4-.4.4-1.1 0-1.5a.8.8 0 0 0-.7-.2"
    />
  </svg>
);
export default SvgRocket;
