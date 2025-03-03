import { defineCollection } from "astro:content";
import { glob, type Loader } from "astro/loaders";
import { slug } from "slug-gen";

const pageLoader: Loader = {
  ...glob,
  name: "Page Loader",
  load: async (loaderParams) => {
    const { store } = loaderParams;
    const baseLoader = glob({
      pattern: "**/*.md",
      base: "./src/content/pages",
    });
    await baseLoader.load.call(this, loaderParams);
    let items = [...store.entries()].map(([_, value]) => value);
    items = items.map((item) => {
      const title = item.data.title;
      return {
        ...item,
        data: {
          ...item.data,
          slug: slug(title),
        },
      };
    });
    store.clear();
    items.forEach((item) => {
      store.set({ ...item });
    });
  },
};

const pages = defineCollection({
  loader: pageLoader,
});


const postLoader: Loader = {
  ...glob,
  name: "Post Loader",
  load: async (loaderParams) => {
    const { store } = loaderParams;
    const baseLoader = glob({
      pattern: "**/*.md",
      base: "./src/content/projects",
    });
    await baseLoader.load.call(this, loaderParams);
    let items = [...store.entries()].map(([_, value]) => value);
    items = items.map((item) => {
      const title = item.data.title;
      return {
        ...item,
        data: {
          ...item.data,
          slug: slug(title),
        },
      };
    });
    store.clear();
    items.forEach((item) => {
      store.set({ ...item });
    });
  },
};

const posts = defineCollection({
  loader: postLoader,
});


export const collections = { pages, posts };
