import 'dotenv/config';
import {google} from 'googleapis';
import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URL } from './env.js';

// insialisasi
const oauthClient = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URL
)

// scopes
const scopes = [
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
]

// generate url/start url
const authorizationUrl = () => (oauthClient.generateAuthUrl({
  access_type: 'offline',
  scope: scopes,
  include_granted_scopes: true
}))

export {oauthClient, authorizationUrl};