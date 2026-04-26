import HelpChatWidget from '@/components/HelpChatWidget'

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <>
      {children}
      <HelpChatWidget />
    </>
  )
}
