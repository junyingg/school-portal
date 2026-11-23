import { Link } from "react-router"
import { ROUTES } from "../routePaths.ts"

export function NotFoundPage() {
  return (
    <>
      <h1>Page not found</h1>
      <p>There is nothing at this address.</p>
      <Link to={ROUTES.classes}>Go to Classes</Link>
    </>
  )
}
