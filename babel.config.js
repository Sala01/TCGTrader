module.exports = function (api) {
    api.cache(true)
    return {
      presets: ['babel-preset-expo'],
      plugins: [] // ← elimina 'nativewind/babel' si estaba aquí
    }
  }
  