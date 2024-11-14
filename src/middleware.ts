import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

import { getSession } from './app/utils/auth'
import {
  fetchShips,
  fetchSignpostFeed,
  fetchWaka,
  person,
} from './app/utils/data'

function checkSize(obj: any) {
  return Buffer.byteLength(JSON.stringify(obj))
}

function tooBig(obj: any) {
  console.log(checkSize(obj))
  // https://vercel.com/docs/errors/REQUEST_HEADER_TOO_LARGE
  return checkSize(obj) > 4096
}

export async function userPageMiddleware(request: NextRequest) {
  const session = await getSession()
  const slackId = session?.slackId

  const response = NextResponse.next()
  if (!slackId) return response

  // Ships base
  try {
    const shipyardPage = request.nextUrl.pathname.startsWith('/shipyard')
    if (shipyardPage && !request.cookies.get('ships')) {
      const ships = await fetchShips(slackId, 3)
      console.log("ships too big:", tooBig(ships))
      response.cookies.set({
        name: 'ships',
        value: JSON.stringify(ships),
        path: '/',
        sameSite: 'strict',
        expires: new Date(Date.now() + 5 * 60 * 1000), // In 5 mins
      })
    }
  } catch (e) {
    console.log('Middleware errored on ships cookie step', e)
  }

  try {
    console.log('Checking for waka cookie')
    if (!request.cookies.get('waka')) {
      const wakaData = await fetchWaka(session)
      console.log("found waka cookie")
      let expiration = 60 * 60 * 1000 // In 1 hour
      if (wakaData?.hasHb) {
        expiration = 7 * 24 * 60 * 60 * 1000 // In 7 days
      }
      console.log("waka too big:", tooBig(wakaData))
      response.cookies.set({
        name: 'waka',
        value: JSON.stringify(wakaData),
        path: '/',
        sameSite: 'strict',
        expires: new Date(Date.now() + expiration),
      })
    }
  } catch (e) {
    console.log('Middleware errored on waka cookie step', e)
  }

  // Person base
  try {
    if (
      !request.cookies.get('tickets') ||
      !request.cookies.get('verification') ||
      !request.cookies.get('academy-completed')
    ) {
      const p = (await person()).fields

      const tickets = Number(p['settled_tickets'])
      console.log("tickets too big:", tooBig(tickets))
      response.cookies.set({
        name: 'tickets',
        value: JSON.stringify(tickets),
        path: '/',
        sameSite: 'strict',
        expires: new Date(Date.now() + 5 * 60 * 1000), // In 5 minutes
      })

      const verificationStatus = p['verification_status'][0]
      const verificationReason = p['Rejection Reason']
      let verifExpiration = 5 * 60 * 1000
      if (verificationStatus.startsWith('Eligible')) {
        verifExpiration = 24 * 60 * 60 * 1000 // In 1 day
      }
      console.log("verification too big:", tooBig(verificationStatus))
      response.cookies.set({
        name: 'verification',
        value: JSON.stringify({
          status: verificationStatus,
          reason: verificationReason,
        }),
        path: '/',
        expires: new Date(Date.now() + verifExpiration),
      })

      const academyCompleted = p['academy_completed'] === true
      let acadExpiration = 60 * 60 * 1000 // In 1 hour
      if (academyCompleted) {
        acadExpiration = 7 * 24 * 60 * 60 * 1000 // In 7 days
      }
      console.log("academy too big:", tooBig(academyCompleted))
      response.cookies.set({
        name: 'academy-completed',
        value: JSON.stringify(academyCompleted),
        path: '/',
        sameSite: 'strict',
        expires: new Date(Date.now() + acadExpiration),
      })
    }
  } catch (e) {
    console.log('Middleware errored on person cookie step', e)
  }

  return response
}

const cronjobMiddleware = async (request: NextRequest) => {
  const authHeader = request.headers.get('authorization')
  const isDev = process.env.NODE_ENV === 'development'
  if (!isDev && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json(
      { success: false, message: 'authentication failed' },
      { status: 401 },
    )
  }
  return NextResponse.next()
}

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/api/cron')) {
    return cronjobMiddleware(request)
  } else {
    return userPageMiddleware(request)
  }
}

export const config = {
  matcher: ['/signpost', '/shipyard', '/wonderdome', '/shop', '/api/cron/'],
}
