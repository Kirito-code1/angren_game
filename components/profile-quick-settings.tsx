"use client";

import { startTransition, useEffect, useRef, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  updateProfileDisciplinesModalAction,
  updateProfileNicknameAction,
} from "@/app/actions";

type DisciplineOption = {
  slug: string;
  shortTitle: string;
  description: string;
  icon: string;
};

type ProfileQuickSettingsCopy = {
  quickSettingsEyebrow: string;
  quickSettingsTitle: string;
  editName: string;
  saveName: string;
  savingName: string;
  cancelEdit: string;
  changeGames: string;
  chooseGames: string;
  gamesModalTitle: string;
  gamesModalCopy: string;
  gamesModalSave: string;
  gamesModalSaving: string;
  selectedGamesTitle: string;
  selectedGamesEmpty: string;
  gamesUpdated: string;
  nicknamePlaceholder: string;
  nicknameHint: string;
};

type ProfileQuickSettingsProps = {
  currentNickname: string;
  selectedDisciplineSlugs: string[];
  disciplines: DisciplineOption[];
  needsDisciplineSelection: boolean;
  copy: ProfileQuickSettingsCopy;
};

function EditIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="clutch-icon-button__icon">
      <path
        d="M13.9 2.6a2.1 2.1 0 0 1 3 3L8 14.4l-4.2.9.9-4.2 9.2-8.5Zm-8 9.2-.5 2.1 2.1-.5 8.3-7.8-1.6-1.6-8.3 7.8Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function ProfileNameEditor({
  currentNickname,
  copy,
}: {
  currentNickname: string;
  copy: Pick<
    ProfileQuickSettingsCopy,
    "editName" | "saveName" | "savingName" | "cancelEdit" | "nicknamePlaceholder" | "nicknameHint"
  >;
}) {
  const router = useRouter();
  const [nickname, setNickname] = useState(currentNickname);
  const [draftNickname, setDraftNickname] = useState(currentNickname);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUpdated, setIsUpdated] = useState(false);
  const [isPending, startNameTransition] = useTransition();

  useEffect(() => {
    setNickname(currentNickname);
    setDraftNickname(currentNickname);
  }, [currentNickname]);

  useEffect(() => {
    if (!isUpdated) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setIsUpdated(false);
    }, 1600);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [isUpdated]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const formData = new FormData();
    formData.set("nickname", draftNickname);

    startNameTransition(async () => {
      const result = await updateProfileNicknameAction(formData);

      if (!result.ok) {
        setError(result.error);
        return;
      }

      setNickname(draftNickname.trim());
      setIsEditing(false);
      setIsUpdated(true);
      startTransition(() => {
        router.refresh();
      });
    });
  }

  return (
    <div className={`clutch-profile-name-editor ${isUpdated ? "is-updated" : ""}`}>
      <div className="clutch-profile-name-editor__header">
        <h1>{nickname}</h1>
        {!isEditing ? (
          <button
            type="button"
            className="clutch-icon-button"
            aria-label={copy.editName}
            title={copy.editName}
            onClick={() => {
              setDraftNickname(nickname);
              setError(null);
              setIsEditing(true);
            }}
          >
            <EditIcon />
          </button>
        ) : null}
      </div>

      {isEditing ? (
        <form className="clutch-profile-name-editor__form" onSubmit={handleSubmit}>
          <input
            type="text"
            name="nickname"
            required
            minLength={3}
            maxLength={24}
            value={draftNickname}
            placeholder={copy.nicknamePlaceholder}
            onChange={(event) => setDraftNickname(event.target.value)}
          />
          <div className="clutch-profile-name-editor__actions">
            <button type="submit" className="clutch-action-button" disabled={isPending}>
              {isPending ? copy.savingName : copy.saveName}
            </button>
            <button
              type="button"
              className="clutch-ghost-button"
              disabled={isPending}
              onClick={() => {
                setDraftNickname(nickname);
                setError(null);
                setIsEditing(false);
              }}
            >
              {copy.cancelEdit}
            </button>
          </div>
          <p className="clutch-profile-name-editor__hint">{error ?? copy.nicknameHint}</p>
        </form>
      ) : null}
    </div>
  );
}

export function ProfileGamesManager({
  selectedDisciplineSlugs,
  disciplines,
  needsDisciplineSelection,
  copy,
}: ProfileQuickSettingsProps) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const [savedDisciplines, setSavedDisciplines] = useState(selectedDisciplineSlugs);
  const [draftDisciplines, setDraftDisciplines] = useState(selectedDisciplineSlugs);
  const [error, setError] = useState<string | null>(null);
  const [isUpdated, setIsUpdated] = useState(false);
  const [isPending, startGamesTransition] = useTransition();

  useEffect(() => {
    setSavedDisciplines(selectedDisciplineSlugs);
    setDraftDisciplines(selectedDisciplineSlugs);
  }, [selectedDisciplineSlugs]);

  useEffect(() => {
    if (!isUpdated) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setIsUpdated(false);
    }, 1800);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [isUpdated]);

  function openModal() {
    setDraftDisciplines(savedDisciplines);
    setError(null);
    dialogRef.current?.showModal();
  }

  function closeModal() {
    dialogRef.current?.close();
  }

  function toggleDiscipline(slug: string) {
    setDraftDisciplines((current) =>
      current.includes(slug)
        ? current.filter((entry) => entry !== slug)
        : [...current, slug],
    );
  }

  function handleSave() {
    setError(null);
    const formData = new FormData();

    draftDisciplines.forEach((slug) => {
      formData.append("disciplines", slug);
    });

    startGamesTransition(async () => {
      const result = await updateProfileDisciplinesModalAction(formData);

      if (!result.ok) {
        setError(result.error);
        return;
      }

      setSavedDisciplines(draftDisciplines);
      setIsUpdated(true);
      closeModal();
      startTransition(() => {
        router.refresh();
      });
    });
  }

  const selectedGames = disciplines.filter((discipline) => savedDisciplines.includes(discipline.slug));

  return (
    <section className={`clutch-dashboard-card clutch-profile-quick-card ${isUpdated ? "is-updated" : ""}`}>
      <div className="clutch-dashboard-card__header">
        <div>
          <p className="clutch-page__eyebrow">{copy.quickSettingsEyebrow}</p>
          <h2>{copy.quickSettingsTitle}</h2>
        </div>
        <button type="button" className="clutch-action-button" onClick={openModal}>
          {needsDisciplineSelection || savedDisciplines.length === 0 ? copy.chooseGames : copy.changeGames}
        </button>
      </div>

      <div className="clutch-profile-selected-games">
        <div className="clutch-profile-selected-games__copy">
          <strong>{copy.selectedGamesTitle}</strong>
          <span>{isUpdated ? copy.gamesUpdated : copy.gamesModalCopy}</span>
        </div>

        <div className="clutch-profile-selected-games__chips">
          {selectedGames.length > 0 ? (
            selectedGames.map((discipline) => (
              <span key={discipline.slug} className="clutch-profile-chip">
                <span aria-hidden>{discipline.icon}</span>
                {discipline.shortTitle}
              </span>
            ))
          ) : (
            <span className="clutch-profile-chip clutch-profile-chip--empty">{copy.selectedGamesEmpty}</span>
          )}
        </div>
      </div>

      <dialog
        ref={dialogRef}
        className="clutch-profile-modal"
        onClose={() => {
          setError(null);
          setDraftDisciplines(savedDisciplines);
        }}
      >
        <div className="clutch-profile-modal__shell">
          <div className="clutch-profile-modal__header">
            <div>
              <p className="clutch-page__eyebrow">{copy.quickSettingsEyebrow}</p>
              <h2>{copy.gamesModalTitle}</h2>
            </div>
            <button type="button" className="clutch-icon-button" aria-label={copy.cancelEdit} onClick={closeModal}>
              <span className="clutch-profile-modal__close" aria-hidden>
                x
              </span>
            </button>
          </div>

          <p className="clutch-profile-modal__copy">{copy.gamesModalCopy}</p>

          <div className="clutch-profile-modal__grid">
            {disciplines.map((discipline) => {
              const isSelected = draftDisciplines.includes(discipline.slug);

              return (
                <button
                  key={discipline.slug}
                  type="button"
                  className={`clutch-profile-modal__option ${isSelected ? "is-selected" : ""}`}
                  onClick={() => toggleDiscipline(discipline.slug)}
                >
                  <span className="clutch-profile-modal__option-icon" aria-hidden>
                    {discipline.icon}
                  </span>
                  <span className="clutch-profile-modal__option-body">
                    <strong>{discipline.shortTitle}</strong>
                    <span>{discipline.description}</span>
                  </span>
                </button>
              );
            })}
          </div>

          <div className="clutch-profile-modal__footer">
            <p className="clutch-profile-name-editor__hint">{error ?? copy.selectedGamesTitle}</p>
            <div className="clutch-profile-modal__actions">
              <button type="button" className="clutch-ghost-button" onClick={closeModal} disabled={isPending}>
                {copy.cancelEdit}
              </button>
              <button type="button" className="clutch-action-button" onClick={handleSave} disabled={isPending}>
                {isPending ? copy.gamesModalSaving : copy.gamesModalSave}
              </button>
            </div>
          </div>
        </div>
      </dialog>
    </section>
  );
}
