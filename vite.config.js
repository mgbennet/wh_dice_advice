export default {
  base: "/wh_dice_advice/",
  test: {
    setupFiles: ["/tests/testUtils.ts"],
  },
  build: {
    rollupOptions: {
      input: {
        main: "index.html",
        firstEd: "pages/uwfirstedition.html",
      },
    },
  },
};
