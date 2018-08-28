# BackstopJS for CiviHR
A comprehensive suite of BackstopJS scenarios to automate visual regression testing for [CiviHR](https://github.com/compucorp/civihr).

## Requirements
Please check [REQUIREMENTS.md](REQUIREMENTS.md) for the full list of requirements.

## How to use it
Install the dependencies
```bash
npm i
```

then follow the [official workflow](https://github.com/garris/BackstopJS#the-backstopjs-workflow) (skip the `init` part), with the only difference being that instead of calling the `backstop` command directly, you should use the `backstopjs:<command>` gulp tasks instead:

```bash
npx gulp backstopjs:report
npx gulp backstopjs:test
npx gulp backstopjs:approve
npx gulp backstopjs:openReport
```

### Original parameters
You can still pass the `--filter` parameter to the tasks:
```bash
npx gulp backstopjs:test --filter "L&A / Dashboard / Calendar"
```

You *cannot* pass the `--config` parameter, as `gulp` will be in charge of generating one on the fly and as such it doesn't allow for it to be overridden.

## Page groups

If you know that your changes will affect only a specific page, there is no need to run the whole test suite (which could be time consuming).

Each scenario is placed in a different JSON file under the *scenarios/* folder. Those files are used to group the scenarios by page or overall functionality.

To run only the scenarios of a specific group, pass the group param to the task, with the value equal to the name of the group file (without the extension).

If for example you want to run BackstopJS only for the Contact Summary page, you can run:

```bash
npx gulp backstopjs:reference --group contact-summary
npx gulp backstopjs:test --group contact-summary
npx gulp backstopjs:approve --group contact-summary
npx gulp backstopjs:openReport --group contact-summary
```

## Contributing
Please check [CONTRIBUTING.md](CONTRIBUTING.md) to read how to contribute to the project.
