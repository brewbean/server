import axios from "axios";
import boom from "@hapi/boom";

const {
  DISCORD_WEBHOOK_BASE,
  DISCORD_NEW_USER_HOOK_ID,
  DISCORD_NEW_USER_HOOK_TOKEN,
  DOMAIN,
} = process.env;

export const newUserController = async (req, res, next) => {
  if (DOMAIN.includes("stage") || DOMAIN.includes("localhost")) {
    return res.send("OK");
  }

  try {
    const { event } = req.body;
    const discordWebhook =
      DISCORD_WEBHOOK_BASE +
      "/" +
      DISCORD_NEW_USER_HOOK_ID +
      "/" +
      DISCORD_NEW_USER_HOOK_TOKEN;

    const username = event.data.new.display_name;

    await axios.post(discordWebhook, {
      content: `@here 🎉 new user has joined brewbean! ✨ **${username}** ✨`,
    });

    res.send("OK");
  } catch (err) {
    return next(boom.internal(JSON.stringify(err)));
  }
};
