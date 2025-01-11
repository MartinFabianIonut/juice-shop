/*
 * Copyright (c) 2014-2024 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */
import { type Request, type Response, type NextFunction } from 'express'
import { UserModel } from '../models/user'
import { jwt } from 'jsonwebtoken'
import * as security from '../lib/insecurity'

require('dotenv').config()
const TOKEN_KEY = process.env.TOKEN_KEY
async function retrieveUserList (req: Request, res: Response, next: NextFunction) {
  try {
    const users = await UserModel.findAll()

    res.json({
      status: 'success',
      data: users.map((user) => {
        const userToken = security.authenticatedUsers.tokenOf(user)
        let lastLoginTime: number | null = null
        if (userToken) {
          try {
            const decoded = jwt.verify(userToken, TOKEN_KEY)
            lastLoginTime = decoded ? Math.floor(new Date(decoded.iat * 1000).getTime()) : null
          } catch (error) {
            return {
              auth: 0
            }
          }
        }

        return {
          ...user.dataValues,
          password: user.password?.replace(/./g, '*'),
          totpSecret: user.totpSecret?.replace(/./g, '*'),
          lastLoginTime
        }
      })
    })
  } catch (error) {
    next(error)
  }
}

export default () => retrieveUserList
