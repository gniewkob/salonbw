import Image from 'next/image'
import icon from './icon.svg'

export default function Icon() {
  return <Image src={icon} alt="SalonBW icon" width={32} height={32} />
}
