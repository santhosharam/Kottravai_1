module.exports = {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: '#8E2A8B', // Brand Purple
                secondary: '#1a1a1a', // Dark Black/Grey
                dark: '#000000', // Pure Black
            },
            fontFamily: {
                sans: ['Nunito', 'sans-serif'],
            },
            container: {
                center: true,
                padding: '1rem',
                screens: {
                    sm: '600px',
                    md: '728px',
                    lg: '984px',
                    xl: '1240px',
                    '2xl': '1280px',
                },
            }
        },
    },
    plugins: [],
}
