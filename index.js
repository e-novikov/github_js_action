const core = require('@actions/core');
const github = require('@actions/github');
const { GitHub } = require('@actions/github/lib/utils');

async function test()
{
  try {
    // `who-to-greet` input defined in action metadata file
    const nameToGreet = core.getInput('who-to-greet');
    console.log(`Hello ${nameToGreet}!`);
    const time = (new Date()).toTimeString();
    core.setOutput("time", time);
    // Get the JSON webhook payload for the event that triggered the workflow

    context = github.context;

    const payload = JSON.stringify(github.context.payload, undefined, 2)
    console.log(`The event payload: ${payload}`);

    const client = new GitHub(core.getInput('token'));

    const eventName = context.eventName;

    base = ""
    head = ""

    switch (eventName) {
      case 'pull_request':
        base = context.payload.pull_request.base.sha;
        head = context.payload.pull_request.head.sha;
        break
      case 'push':
        base = context.payload.before;
        head = context.payload.after;
        break
      default:
        core.setFailed(
          `This action only supports pull requests and pushes, ${context.eventName} events are not supported. ` +
            "Please submit an issue on this action's GitHub repo if you believe this in correct."
        );
    }

    core.info(`Base commit: ${base}`);
    core.info(`Head commit: ${head}`);

    if (!base || !head) {
      core.setFailed(
        `The base and head commits are missing from the payload for this ${context.eventName} event. ` +
          "Please submit an issue on this action's GitHub repo."
      )

      // To satisfy TypeScript, even though this is unreachable.
      base = ''
      head = ''
    }

    // Use GitHub's compare two commits API.
    // https://developer.github.com/v3/repos/commits/#compare-two-commits
    const response = await client.repos.compareCommits({
      base,
      head,
      owner: context.repo.owner,
      repo: context.repo.repo
    })

    // Ensure that the request was successful.
    if (response.status !== 200) {
      core.setFailed(
        `The GitHub API for comparing the base and head commits for this ${context.eventName} event returned ${response.status}, expected 200. ` +
          "Please submit an issue on this action's GitHub repo."
      )
    }

    console.log(`Response:`);
    console.log(response.data);
    console.log(JSON.stringify(response.data, undefined, 2))

  } catch (error) {
    core.setFailed(error.message);
  }
}

test();