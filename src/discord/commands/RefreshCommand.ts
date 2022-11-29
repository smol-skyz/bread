import { ChatInputCommandInteraction } from 'discord.js';
import { refreshProfileMetadata } from '../../utils/DiscordUtils';
import { DiscordChatInputCommand } from '../types/DiscordChatInputCommand';

export class RefreshCommand extends DiscordChatInputCommand {
  constructor() {
    super({
      name: 'refresh',
      description: 'Refresh Discord connection data.',
    });
  }

  async handle(commandInteraction: ChatInputCommandInteraction): Promise<unknown> {
    await commandInteraction.deferReply({
      ephemeral: true,
    });
    const refreshSucessful = await refreshProfileMetadata(commandInteraction.user.id);
    if (!refreshSucessful) {
      // Unsucessful refresh
      return commandInteraction.editReply({
        content: `The profile metadata refresh was unsucessful. Please make sure that you have authorized the bot with the following link: <${process.env.DISCORD_OAUTH2_BASE_URI}/auth/start>`,
      });
    }
    return commandInteraction.editReply({
      content: `Your profile metadata has been refreshed.`,
    });
  }
}
