namespace GenericPaladinsPack {

    type ConsoleCallback = {
        (params: string[]) : void
    }
    const luaRegexPatternToFunction = new Map<string, ConsoleCallback>()

    export namespace ConsoleHandler {
        
        export function Register(luaRegexPattern: string, callback: ConsoleCallback) {
            luaRegexPatternToFunction.set(luaRegexPattern, callback)
        }

        function SetupConsoleOnExecuteButton() {

            core.add_listener(
                "GenericPaladinsPack pj console on execute",
                "ComponentLClickUp",
                context => context.string == "pj_console_button",
                context => {
                    const ConsoleTextBox = GetConsoleTextBox()
                    if(ConsoleTextBox == null) return

                    const input = ConsoleTextBox.GetStateText()
                    const luaRegexPatterns = Array.from(luaRegexPatternToFunction.keys())
                    for (const pattern of luaRegexPatterns) {
                        const text = input[0]
                        const params = LuaStringMatcher(text, pattern)
                        const fun = luaRegexPatternToFunction.get(pattern)
                        if(params.length > 0) if(fun) fun(params)
                    }
                },
                true                
            )
        }

        function GetConsoleTextBox() {
            return CommonUserInterface.Find(CommonUserInterface.GetRootUI(), "pj_console_text_box")        
        }
    
        function Init() {
            SetupConsoleOnExecuteButton()
        }
    
        OnCampaignStart( () => Init() )
    }

}