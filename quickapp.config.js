module.exports = {
  webpack: {
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: [
            {
              loader: "ts-loader"
            }
          ]
        }
      ]
    },
    fallback: {}
  },
  cli: {
    "enable-custom-component": true,
    "enable-jsc": true,
    "enable-protobuf": true
  }
}
