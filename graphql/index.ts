// ============================================
// CENTRALIZED EXPORTS FOR ALL GRAPHQL OPERATIONS
// ============================================

// USER
export { GET_USERS, GET_USER, GET_USER_FOR_LOGIN } from "./user/queries";

export {
  LOGIN,
  REGISTER,
  UPDATE_USER,
  FOLLOW_USER,
  UNFOLLOW_USER,
} from "./user/mutations";

// CLUB
export { GET_CLUBS, GET_CLUB } from "./club/queries";

// OPPORTUNITY
export { GET_JOB_OPPORTUNITIES, GET_USER_APPLICATIONS } from "./opportunity/queries";

export { APPLY_FOR_JOB } from "./opportunity/mutations";

// NOTIFICATION
export {
  GET_NOTIFICATIONS,
  GET_UNREAD_NOTIFICATIONS_COUNT,
} from "./notification/queries";

export {
  MARK_NOTIFICATION_AS_READ,
  MARK_ALL_NOTIFICATIONS_AS_READ,
  REMOVE_NOTIFICATION,
  CLEAR_ALL_NOTIFICATIONS,
} from "./notification/mutations";
