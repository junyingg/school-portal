const EIGHT_DIGITS = /^\d{8}$/
const GROUP_LENGTH = 4

export function formatContactNumber(contactNumber: string): string {
  if (!EIGHT_DIGITS.test(contactNumber)) {
    return contactNumber
  }
  return `${contactNumber.slice(0, GROUP_LENGTH)} ${contactNumber.slice(GROUP_LENGTH)}`
}
