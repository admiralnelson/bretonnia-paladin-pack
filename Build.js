/* eslint-disable */
const fs = require('fs')
const { spawnSync } = require('child_process')
const path = require('path')
const { dir } = require('console')

const RPFM_PATH = "D:/programs/rpfm shit/"
const SCHEMA_PATH = `C:/Users/admir/AppData/Roaming/rpfm/config/schemas/schema_wh3.ron`
const PROJECT_NAME = `Generic_Paladin_Packs`

spawnSync(`${RPFM_PATH}/rpfm_cli.exe`, [ `--version` ], 
{ encoding: 'utf8', stdio: 'inherit' })

try {
    fs.mkdirSync("build")
    fs.mkdirSync("temp")
} catch (error) {}

if(fs.existsSync("/build")) {
    fs.rmSync("/build", { recursive: true })
}

if(!fs.existsSync("data.pack")) {
    throw `cannot pack! data.pack was not found`
}

function BuildTypescriptProject() {
    console.log(`compiling typescript project`)
    try {
        fs.rmSync(`script/`, { recursive: true })
    } catch (error) { }
    
    const result = spawnSync(`build_campaign.bat`, [], {
        stdio: "inherit",
        encoding: 'utf8'
    })
    if(result.status != 0) throw `fail at compiling typescript project`
}

//compile stage
BuildTypescriptProject()

//packing stage

console.log(`Complete`)


