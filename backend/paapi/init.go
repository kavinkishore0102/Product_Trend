package paapi

// Cfg holds the loaded configuration, accessible from handler package.
// Initialised once in main.go via paapi.Init().
var Cfg Config
var CfgOK bool

// Init loads credentials from env vars and stores them for use by handlers.
func Init() {
	Cfg, CfgOK = LoadConfig()
}
