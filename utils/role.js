const PERMISSIONS = {
    ALL: 0,
    VIEW_USERS: 1,
    VIEW_POSTS: 2,
    VIEW_CHANNELS: 3,
    MANAGE_USERS: 4,
    MANAGE_POSTS: 5,
    MANAGE_CHANNELS: 6,
    MANAGE_TAGS: 7
};

const ROLES = {
    USER: 0,
    ADMIN: 1
}

const ROLE_VALUES = {
    [ROLES.USER]: {
        id: 0,
        name: "User",
        permissions: []
    },
    [ROLES.ADMIN]: {
        id: 1,
        name: "Admin",
        permissions: [PERMISSIONS.ALL]
    }
}

module.exports = { ROLES, PERMISSIONS, ROLE_VALUES }