import { ApproveMenu } from './approve-menu'

export default async function ApproveContent({
    params,
  }: {
    params: Promise<{ id: string }>
  }) {
  const { id } = await params

  return <ApproveMenu id={id}/>
} 