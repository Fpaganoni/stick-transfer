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

// NEWS
export { GET_NEWS, GET_NEWS_ARTICLE } from "./news/queries";

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

// ADMIN
export {
  ADMIN_DASHBOARD_STATS,
  ADMIN_USERS,
  ADMIN_CLUBS,
  ADMIN_JOB_OPPORTUNITIES,
  ADMIN_JOB_APPLICATIONS,
  SUPER_ADMIN_NEWS_ARTICLES,
} from "./admin/queries";

export {
  ADMIN_SET_USER_ACTIVE,
  ADMIN_SET_USER_VERIFIED,
  ADMIN_CHANGE_USER_ROLE,
  ADMIN_SET_CLUB_VERIFICATION,
  ADMIN_UPDATE_APPLICATION_STATUS,
  CREATE_NEWS_ARTICLE,
  UPDATE_NEWS_ARTICLE,
  DELETE_NEWS_ARTICLE,
  PUBLISH_NEWS_ARTICLE,
  UNPUBLISH_NEWS_ARTICLE,
} from "./admin/mutations";
