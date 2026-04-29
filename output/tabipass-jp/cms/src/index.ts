import fs from "node:fs";
import path from "node:path";

export default {
  register() {},

  async bootstrap({ strapi }: { strapi: any }) {
    // 1. Seed pages if none exist.
    try {
      const existing = await strapi.documents("api::page.page").findMany({});
      if (!existing || existing.length === 0) {
        const seedPath = path.join(strapi.dirs.app.root, "seed", "pages.json");
        if (fs.existsSync(seedPath)) {
          const seed = JSON.parse(fs.readFileSync(seedPath, "utf8"));
          for (const entry of seed) {
            await strapi.documents("api::page.page").create({
              data: entry,
              status: "published",
            });
          }
          strapi.log.info(`Seeded ${seed.length} page(s).`);
        }
      }
    } catch (err: any) {
      strapi.log.warn(`Seed step skipped: ${err?.message || err}`);
    }

    // 2. Grant public read on api::page.page.
    try {
      const publicRole = await strapi
        .query("plugin::users-permissions.role")
        .findOne({ where: { type: "public" } });
      if (publicRole) {
        const actions = ["api::page.page.find", "api::page.page.findOne"];
        for (const action of actions) {
          const existing = await strapi
            .query("plugin::users-permissions.permission")
            .findOne({ where: { action, role: publicRole.id } });
          if (existing) {
            if (!existing.enabled) {
              await strapi
                .query("plugin::users-permissions.permission")
                .update({
                  where: { id: existing.id },
                  data: { enabled: true },
                });
            }
          } else {
            await strapi
              .query("plugin::users-permissions.permission")
              .create({
                data: { action, enabled: true, role: publicRole.id },
              });
          }
        }
        strapi.log.info("Public read permissions ensured for api::page.page.");
      }
    } catch (err: any) {
      strapi.log.warn(`Permission step skipped: ${err?.message || err}`);
    }
  },
};
