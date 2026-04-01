/**
 * Root page — redirect ไป /login หรือ /dashboard
 */

import { redirect } from 'next/navigation'

export default function Home() {
  redirect('/login')
}
