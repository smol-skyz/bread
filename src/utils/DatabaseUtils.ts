import { EnabledChannel, User } from '@prisma/client';
import { prismaClient } from '../index.js';

export async function isEnabledChannel(guildId: string, channelId: string): Promise<boolean> {
  const foundChannelCount = await prismaClient.enabledChannel.count({
    where: {
      guild_id: BigInt(guildId),
      channel_id: BigInt(channelId),
    },
  });
  return foundChannelCount != 0;
}

export async function getEnabledChannel(guildId: string, channelId: string): Promise<EnabledChannel | null> {
  const foundChannel = await prismaClient.enabledChannel.findFirst({
    where: {
      guild_id: BigInt(guildId),
      channel_id: BigInt(channelId),
    },
  });
  return foundChannel;
}

// Get the total number of usages
export async function getGlobalCount(): Promise<bigint> {
  const usageCountResponse = await prismaClient.usage.aggregate({
    _sum: {
      counter: true,
    },
  });
  return usageCountResponse._sum.counter || BigInt(0);
}

// Get the total number of usages for a specific guild
export async function getGlobalGuildCount(guildId: string): Promise<bigint> {
  const usageCountResponse = await prismaClient.usage.aggregate({
    _sum: {
      counter: true,
    },
    where: {
      guild_id: BigInt(guildId),
    },
  });
  return usageCountResponse._sum.counter || BigInt(0);
}

// Get the total number of usages for a specific channel in a guild
export async function getGlobalChannelCount(guildId: string, channelId: string): Promise<bigint> {
  const usageCountResponse = await prismaClient.usage.aggregate({
    _sum: {
      counter: true,
    },
    where: {
      guild_id: BigInt(guildId),
      channel_id: BigInt(channelId),
    },
  });
  return usageCountResponse._sum.counter || BigInt(0);
}

// Get the global leaderboard position for a specific guild
export async function getGlobalLeaderboardPositionForGuild(guildId: string): Promise<number> {
  const usageLeaderboardResponse = await prismaClient.usage.groupBy({
    by: ['guild_id'],
    _sum: {
      counter: true,
    },
    orderBy: {
      _sum: {
        counter: 'desc',
      },
    },
  });
  for (let i = 0; i < usageLeaderboardResponse.length; i += 1) {
    if (usageLeaderboardResponse[i].guild_id === BigInt(guildId)) {
      return i + 1;
    }
  }
  return -1;
}

// Get the total number of usages for a specific user
export async function getGlobalCountForUser(userId: string): Promise<bigint> {
  const usageCountResponse = await prismaClient.usage.aggregate({
    _sum: {
      counter: true,
    },
    where: {
      user_id: BigInt(userId),
    },
  });
  return usageCountResponse._sum.counter || BigInt(0);
}

// Get the global leaderboard position for a specific user
export async function getGlobalLeaderboardPositionForUser(guildId: string): Promise<number> {
  const usageLeaderboardResponse = await prismaClient.usage.groupBy({
    by: ['user_id'],
    _sum: {
      counter: true,
    },
    orderBy: {
      _sum: {
        counter: 'desc',
      },
    },
  });
  for (let i = 0; i < usageLeaderboardResponse.length; i += 1) {
    if (usageLeaderboardResponse[i].user_id === BigInt(guildId)) {
      return i + 1;
    }
  }
  return -1;
}

// Get the total number of usages for a specific user in a guild
export async function getGuildCountForUser(guildId: string, userId: string): Promise<bigint> {
  const usageCountResponse = await prismaClient.usage.aggregate({
    _sum: {
      counter: true,
    },
    where: {
      guild_id: BigInt(guildId),
      user_id: BigInt(userId),
    },
  });
  return usageCountResponse._sum.counter || BigInt(0);
}

// Get the leaderboard position for a specific user in a guild
export async function getGuildLeaderboardPositionForUser(guildId: string, userId: string): Promise<number> {
  const usageLeaderboardResponse = await prismaClient.usage.groupBy({
    where: {
      guild_id: BigInt(guildId),
    },
    by: ['user_id'],
    _sum: {
      counter: true,
    },
    orderBy: {
      _sum: {
        counter: 'desc',
      },
    },
  });
  for (let i = 0; i < usageLeaderboardResponse.length; i += 1) {
    if (usageLeaderboardResponse[i].user_id === BigInt(userId)) {
      return i + 1;
    }
  }
  return -1;
}

// Get the total number of usages for a specific user in a channel
export async function getChannelCountForUser(guildId: string, channelId: string, userId: string): Promise<bigint> {
  const usageCountResponse = await prismaClient.usage.aggregate({
    _sum: {
      counter: true,
    },
    where: {
      guild_id: BigInt(guildId),
      channel_id: BigInt(channelId),
      user_id: BigInt(userId),
    },
  });
  return usageCountResponse._sum.counter || BigInt(0);
}

// Get the leaderboard position for a specific user in a channel
export async function getChannelLeaderboardPositionForUser(guildId: string, channelId: string, userId: string): Promise<number> {
  const usageLeaderboardResponse = await prismaClient.usage.groupBy({
    where: {
      guild_id: BigInt(guildId),
      channel_id: BigInt(channelId),
    },
    by: ['user_id'],
    _sum: {
      counter: true,
    },
    orderBy: {
      _sum: {
        counter: 'desc',
      },
    },
  });
  for (let i = 0; i < usageLeaderboardResponse.length; i += 1) {
    if (usageLeaderboardResponse[i].user_id === BigInt(userId)) {
      return i + 1;
    }
  }
  return -1;
}

export type UserLeaderboardItem = {
  user_id: bigint;
  count: bigint;
  place: number;
};

// Get global users leaderboard
export async function getGlobalUsersLeaderboard(): Promise<UserLeaderboardItem[]> {
  const usageLeaderboardResponse = await prismaClient.usage.groupBy({
    by: ['user_id'],
    _sum: {
      counter: true,
    },
    orderBy: {
      _sum: {
        counter: 'desc',
      },
    },
    take: 10,
  });
  const leaderboardItems: UserLeaderboardItem[] = [];
  for (let i = 0; i < usageLeaderboardResponse.length; i += 1) {
    const user = await getUser(usageLeaderboardResponse[i].user_id);
    leaderboardItems.push({
      user_id: user !== null ? user.id : BigInt(0),
      count: usageLeaderboardResponse[i]._sum.counter || BigInt(0),
      place: i + 1,
    });
  }
  return leaderboardItems;
}

// Get guild users leaderboard
export async function getGuildUsersLeaderboard(guildId: string): Promise<UserLeaderboardItem[]> {
  const usageLeaderboardResponse = await prismaClient.usage.groupBy({
    where: {
      guild_id: BigInt(guildId),
    },
    by: ['user_id'],
    _sum: {
      counter: true,
    },
    orderBy: {
      _sum: {
        counter: 'desc',
      },
    },
    take: 10,
  });
  const leaderboardItems: UserLeaderboardItem[] = [];
  for (let i = 0; i < usageLeaderboardResponse.length; i += 1) {
    const user = await getUser(usageLeaderboardResponse[i].user_id);
    leaderboardItems.push({
      user_id: user !== null ? user.id : BigInt(0),
      count: usageLeaderboardResponse[i]._sum.counter || BigInt(0),
      place: i + 1,
    });
  }
  return leaderboardItems;
}

export async function getUser(userId: bigint): Promise<User | null> {
  return prismaClient.user.findUnique({
    where: {
      id: userId,
    },
  });
}
