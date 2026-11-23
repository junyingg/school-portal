import { useNavigate } from "react-router"

export interface SubmitThenReturn<Values> {
  readonly submit: (values: Values) => Promise<void>
  readonly goBack: () => void
}

export function useSubmitThenReturn<Values>(
  create: (values: Values) => Promise<unknown>,
  returnPath: string,
  onSuccess?: () => void,
): SubmitThenReturn<Values> {
  const navigate = useNavigate()

  const goBack = () => {
    void navigate(returnPath)
  }

  const submit = async (values: Values) => {
    const wasCreated = await create(values).then(
      () => true,
      () => false,
    )
    if (wasCreated) {
      onSuccess?.()
      goBack()
    }
  }

  return { submit, goBack }
}
