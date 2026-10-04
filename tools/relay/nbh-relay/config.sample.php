<?php
/*
 * Settings for the NBH writing-help relay.
 *
 * The first time https://newsomebh.com/ai/admin is opened, the relay copies this file to config.php (in this
 * same nbh-relay folder) and fills in PEPPER. Edit config.php, not this file: an update of the relay
 * replaces this file but never config.php. Keep config.php private: it holds the API key. It is outside
 * public_html, so it cannot be downloaded from the website.
 *
 * Text goes between the quotes. Numbers and true/false have no quotes. Keep the comma at the end of each line.
 */
return [
    // 1. Your Anthropic API key (Anthropic Console > API keys). It starts with sk-ant-. Paste it between the quotes.
    'ANTHROPIC_API_KEY' => '',

    // 2. The admin password, as a hash. Open https://newsomebh.com/ai/admin: the setup page makes this line for
    //    you (or run  php ~/nbh-relay/make-admin-hash.php  in cPanel's Terminal). Replace this whole line with it.
    'ADMIN_PASSWORD_HASH' => '',

    // 3. A long random secret that keeps passcodes and sessions hashed. Filled in when config.php is made.
    //    Changing it ends every passcode and session.
    'PEPPER' => '',

    // Sessions and passcodes
    'SESSION_HOURS' => 8,               // how long a browser tab stays unlocked after its passcode is used
    'CODE_HOURS' => 24,                 // how long a new passcode can wait to be used (the admin page can pick per passcode)
    'MAX_CODE_HOURS' => 168,            // the longest wait the admin page offers (168 hours = 7 days)
    'MAX_REQUESTS_PER_SESSION' => 300,  // rewrites one session can make
    'MAX_CHARS' => 4000,                // the longest text one rewrite takes, in characters

    // Limits that protect the API bill (set a monthly spend limit in the Anthropic Console as well). A rewrite
    // usually costs 1 to 6 cents; the most one can cost, with a full text and the longest answer, is about
    // 21 cents at EFFORT 'low', so these limits cap the worst day at about REWRITES_PER_DAY x 21 cents.
    'REWRITES_PER_MINUTE' => 10,        // per session
    'REWRITES_PER_DAY' => 300,          // all sessions together, in any 24 hours

    // The sites the forms are on. Calls from any other site are refused.
    'ALLOWED_ORIGINS' => ['https://newsomebh.com', 'https://www.newsomebh.com'],

    // Wrong tries before a pause of FAIL_WINDOW_MINUTES
    'REDEEM_FAILS_PER_IP' => 10,        // wrong passcodes from one internet address
    'REDEEM_FAILS_ALL' => 2000,         // wrong passcodes from everywhere together (a passcode cannot be guessed)
    'LOGIN_FAILS_PER_IP' => 5,          // wrong admin passwords from one internet address
    'LOGIN_FAILS_ALL' => 20,            // wrong admin passwords from everywhere together (devices that signed in
                                        // here before still can; to let a new one in, raise this for a moment)
    'FAIL_WINDOW_MINUTES' => 15,
    'ADMIN_SESSION_MINUTES' => 30,      // the admin page signs out after this long without use

    // The rewrite itself
    'EFFORT' => 'low',                  // low, medium, high, xhigh or max: higher thinks longer, so it is slower and costs more
                                        // (the room for thinking grows with it, from 8,000 to 64,000 tokens: at 'max'
                                        // one rewrite can cost up to about $1.30, and may take longer than the forms wait)
    'MAX_OUTPUT_TOKENS' => 0,           // 0 = chosen to suit EFFORT
    'TIMEOUT_SECONDS' => 50,            // the forms wait 60 seconds for an answer

    // Once every page of newsomebh.com opens with https://, set this to true: browsers that have opened the
    // relay will then use https for the whole site for a year, even when an address is typed without it.
    'HSTS' => false,

    // Leave these as they are
    'API_BASE_URL' => 'https://api.anthropic.com',
    'REQUIRE_HTTPS' => true,
    'BASE_PATH' => '',                  // '' = worked out from where index.php is
    'DATA_DIR' => '',                   // '' = nbh-relay/data
];
