import { ApplicationCommandOptionType } from 'discord-api-types';
import { CommandInteraction } from 'discord.js';
import { prismaClient } from '../..';
import { isEnabledChannel } from '../../utils/DatabaseUtils';
import { getCurrentCommandInteractionChannelId } from '../../utils/DiscordUtils';
import { DiscordChatInputCommand } from '../types/DiscordChatInputCommand';

export class ToggleBreadOnlyCommand extends DiscordChatInputCommand {
  constructor() {
    super({
      name: 'togglebreadonly',
      description: 'Toggle if the current channel should be a bread only channel.',
      options: [
        {
          type: ApplicationCommandOptionType.Boolean,
          name: 'allow_custom_emojis',
          description: 'If the custom bread emojis should be allowed in this channel. (Default: false)',
          required: false,
        },
      ],
    });
  }

  async handle(commandInteraction: CommandInteraction): Promise<void> {
    const currentChannelId = getCurrentCommandInteractionChannelId(commandInteraction);
    if (!commandInteraction.inGuild()) {
      return commandInteraction.reply({
        content: 'This command must be used in a guild.',
        ephemeral: true,
      });
    }
    if (!commandInteraction.memberPermissions.has('MANAGE_GUILD')) {
      return commandInteraction.reply({
        content: 'You need to have manage server permissions to toggle the bread only channel state.',
        ephemeral: true,
      });
    }
    if (commandInteraction.channel?.isThread()) {
      return commandInteraction.reply({
        content: 'This command cannot be run in this channel.',
        ephemeral: true,
      });
    }
    const isRunInEnabledChannel = await isEnabledChannel(commandInteraction.guildId, currentChannelId);
    if (isRunInEnabledChannel) {
      await prismaClient.enabledChannel.delete({
        where: {
          guild_id_channel_id: {
            guild_id: BigInt(commandInteraction.guildId),
            channel_id: BigInt(currentChannelId),
          },
        },
      });
      return commandInteraction.reply({
        content: 'The current channel is no longer a bread only channel.',
        ephemeral: false,
      });
    } else {
      let allowCustomEmojis = commandInteraction.options.getBoolean('allow_custom_emojis', false);
      if (allowCustomEmojis === null) allowCustomEmojis = false;
      await prismaClient.enabledChannel.create({
        data: {
          guild_id: BigInt(commandInteraction.guildId),
          channel_id: BigInt(currentChannelId),
          allow_custom_emojis: allowCustomEmojis,
        },
      });
      let additionalMessage = '';
      if (!commandInteraction.channel || !commandInteraction.guild?.me?.permissionsIn(currentChannelId).has('MANAGE_MESSAGES')) {
        additionalMessage = `Please give ${commandInteraction.client.user?.username} the manage messages permission, without this permission, it cannot delete non-bread messages.`;
      }
      return commandInteraction.reply({
        content: [`The current channel is now a bread only channel.${allowCustomEmojis ? ' (With custom emojis)' : ''}`, additionalMessage]
          .join('\n')
          .trim(),
        ephemeral: false,
      });
    }
  }
}
