require(`dotenv`).config({
    path: `.env`,
})

module.exports = {
    siteMetadata: {
        siteTitle: `Brendan Heussler`,
        siteTitleAlt: `Brendan Heussler — Software Consultant`,
        siteUrl: `https://builtbybrendan.com`,
        siteDescription: `Independent software consultant in San Diego. I build resilient web products, scalable platforms, and practical automation.`,
        siteLanguage: `en`,
        author: `@beedaan`,
    },
    plugins: [
        `gatsby-plugin-sitemap`,
        {
            resolve: `gatsby-plugin-manifest`,
            options: {
                name: `Brendan Heussler — Software Consultant in San Diego`,
                short_name: `Brendan Heussler`,
                description: `Independent software consultant in San Diego.`,
                start_url: `/`,
                background_color: `#f4efe4`,
                theme_color: `#263d31`,
                display: `standalone`,
                icons: [
                    {
                        src: `/android-chrome-192x192.png`,
                        sizes: `192x192`,
                        type: `image/png`,
                    },
                    {
                        src: `/android-chrome-512x512.png`,
                        sizes: `512x512`,
                        type: `image/png`,
                    },
                ],
            },
        },
        `gatsby-plugin-netlify`,
        `gatsby-plugin-sharp`,
    ],
}
