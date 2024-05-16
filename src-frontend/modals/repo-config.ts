import { settings, misc } from "@/components";
import van, { PropsWithKnownKeys, State } from "vanjs-core";
import tippy from "tippy.js";
import api, { Project, remoteExists } from "@/api";

const { main, button, h1, div, span, input, label, br, p } = van.tags;

const PENCIL = document
  .querySelector(`.${misc.menuItems}`)!
  .children[2].children[0].cloneNode() as HTMLImageElement;

function isValidUrl(url: string) {
  try {
    return Boolean(new URL(url));
  } catch (_) {
    return false;
  }
}

const InputField = (...children: any[]) =>
  p({ class: "input-field" }, children);

const InputBox = (props: PropsWithKnownKeys<HTMLInputElement>) =>
  input({
    ...props,
    type: "text",
    class: [settings.inputField, "input-box"].join(" "),
  });

export class RepoConfigModal extends HTMLDialogElement {
  editing!: State<boolean>;
  project!: Project;
  fields!: {
    repository: HTMLInputElement;
    name: HTMLInputElement;
    email: HTMLInputElement;
  };

  constructor() {
    super();
  }

  connectedCallback() {
    if (this.querySelector("main")) return;

    this.editing = van.state(false);

    const closeButton = button(
      {
        class: settings.settingsButton,
        style: "margin-left: 10px",
        onclick: () => this.close(),
      },
      "Close"
    );

    const repository = InputBox({
      placeholder: "Enter a link to a repository URL",
      onblur: async ({ target }: Event) => {
        let url: string = (target as HTMLInputElement).value;
        if (this.editing.val === true) {
          if (!isValidUrl(url) && !(await remoteExists(url))) {
            repository.value = "";
          }
        }
      },
    });
    const name = InputBox({});
    const email = InputBox({});

    const editButton = button(
      {
        class: settings.settingsButton,
        style:
          "display: flex; padding: 0.4rem; margin-left: auto; align-items: center",
        onclick: () => {
          if (!this.editing.val) {
            this.editing.val = true;
            editButton.innerHTML = `<i class="fa-solid fa-floppy-disk floppy-save-button"></i>`;
          } else {
            if (name.value.trim() === "" || repository.value.trim() === "") {
              alert("Don't leave starred fields blank!");
              return;
            }
            this.editing.val = false;
            editButton.innerHTML = "";
            editButton.appendChild(PENCIL);
            this.project.setDetails({
              username: name.value,
              email: email.value,
              repository: repository.value,
            });
          }
        },
      },
      PENCIL
    );

    van.derive(() => {
      if (this.editing.oldVal !== this.editing.val) {
        let e: "add" | "remove" = !this.editing.val ? "add" : "remove";
        repository.classList[e]("disabled-config-input");
        name.classList[e]("disabled-config-input");
        email.classList[e]("disabled-config-input");
      }
    });

    van.add(
      this,
      main(
        { id: "commitList" },
        h1(
          { style: "display: flex; gap: 10px" },
          "Configure your ",
          span(
            {
              class: "tip",
              id: "repositoryTip",
            },
            "repository"
          ),
          editButton
        ),
        InputField(
          label({ class: "input-label" }, "Repository URL*"),
          repository
        ),
        br(),
        InputField(label({ class: "input-label" }, "Name*"), name),
        br(),
        InputField(label({ class: "input-label" }, "Email (optional)"), email),
        br(),
        br(),
        div(
          {
            class: "bottom-bar",
            style: "margin: 0; padding: 0; bottom: 10px; margin-left: 10px",
          },
          closeButton
        )
      )
    );

    repository.classList.add("disabled-config-input");
    name.classList.add("disabled-config-input");
    email.classList.add("disabled-config-input");

    this.fields = {
      repository,
      name,
      email,
    };
  }

  async display() {
    tippy("#repositoryTip", {
      content: "A repository (repo) is a place to store your project online",
      appendTo: this,
    });

    this.project = (await api.getCurrentProject())!;
    let details = await this.project?.getDetails();

    // in the future, these will never be blank
    this.fields.repository.value = details?.repository ?? "";
    this.fields.name.value = details?.username ?? "";
    this.fields.email.value = details?.email ?? "";

    if (!this.open) this.showModal();
  }
}
