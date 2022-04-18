import React, { useContext, useEffect } from 'react';
import appContext from '../stores/appContext';
import useToggle from '../hooks/useToggle';
import useLoading from '../hooks/useLoading';
import Only from './common/OnlyWhen';
import utils from '../helpers/utils';
import { locationService, queryService } from '../services';
import showCreateQueryDialog from './CreateQueryDialog';
import '../less/query-list.less';
import More from '../icons/more.svg?component';
import MoreWhite from '../icons/more-white.svg?component';
import { Notice } from 'obsidian';
import { t } from '../translations/helper';

interface Props {}

const QueryList: React.FC<Props> = () => {
  const {
    queryState: { queries },
    locationState: {
      query: { filter },
    },
  } = useContext(appContext);
  const loadingState = useLoading();
  const sortedQueries = queries
    .sort((a, b) => utils.getTimeStampByDate(b.createdAt) - utils.getTimeStampByDate(a.createdAt))
    .sort((a, b) => utils.getTimeStampByDate(b.pinnedAt ?? 0) - utils.getTimeStampByDate(a.pinnedAt ?? 0));

  useEffect(() => {
    queryService
      .getMyAllQueries()
      .catch(() => {
        // do nth
      })
      .finally(() => {
        loadingState.setFinish();
      });
  }, []);

  return (
    <div className="queries-wrapper">
      <p className="title-text">
        <span className="normal-text">{t('QUERY')}</span>
        <span className="btn" onClick={() => showCreateQueryDialog()}>
          +
        </span>
      </p>
      <Only when={loadingState.isSucceed && sortedQueries.length === 0}>
        <div className="create-query-btn-container">
          <span className="btn" onClick={() => showCreateQueryDialog()}>
            {t('CREATE FILTER')}
          </span>
        </div>
      </Only>
      <div className="queries-container">
        {sortedQueries.map((q) => {
          return <QueryItemContainer key={q.id} query={q} isActive={q.id === filter} />;
        })}
      </div>
    </div>
  );
};

interface QueryItemContainerProps {
  query: Model.Query;
  isActive: boolean;
}

const QueryItemContainer: React.FC<QueryItemContainerProps> = (props: QueryItemContainerProps) => {
  const { query, isActive } = props;
  const [showActionBtns, toggleShowActionBtns] = useToggle(false);
  const [showConfirmDeleteBtn, toggleConfirmDeleteBtn] = useToggle(false);

  const handleQueryClick = () => {
    if (isActive) {
      locationService.setMemoFilter('');
    } else {
      // if (!["/", "/recycle"].includes(locationService.getState().pathname)) {
      //   locationService.setPathname("/");
      // }
      locationService.setMemoFilter(query.id);
    }
  };

  const handleShowActionBtnClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    toggleShowActionBtns();
  };

  const handleActionBtnContainerMouseLeave = () => {
    toggleShowActionBtns(false);
  };

  const handleDeleteMemoClick = async (event: React.MouseEvent) => {
    event.stopPropagation();

    if (showConfirmDeleteBtn) {
      try {
        await queryService.deleteQuery(query.id);
      } catch (error: any) {
        new Notice(error.message);
      }
    } else {
      toggleConfirmDeleteBtn();
    }
  };

  const handleEditQueryBtnClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    showCreateQueryDialog(query.id);
  };

  const handlePinQueryBtnClick = async (event: React.MouseEvent) => {
    event.stopPropagation();

    try {
      if (query.pinnedAt) {
        await queryService.unpinQuery(query.id);
        queryService.editQuery({
          ...query,
          pinnedAt: '',
        });
      } else {
        await queryService.pinQuery(query.id);
        queryService.editQuery({
          ...query,
          pinnedAt: utils.getDateTimeString(Date.now()),
        });
      }
    } catch (error) {
      // do nth
    }
  };

  const handleDeleteBtnMouseLeave = () => {
    toggleConfirmDeleteBtn(false);
  };

  return (
    <>
      <div className={`query-item-container ${isActive ? 'active' : ''}`} onClick={handleQueryClick}>
        <div className="query-text-container">
          <span className="icon-text">#</span>
          <span className="query-text">{query.title}</span>
        </div>
        <div className="btns-container">
          <span className="action-btn toggle-btn" onClick={handleShowActionBtnClick}>
            {/*<img className="icon-img" src={isActive ? moreWhite : more} />*/}
            {isActive ? <MoreWhite /> : <More />}
          </span>
          <div
            className={`action-btns-wrapper ${showActionBtns ? '' : 'hidden'}`}
            onMouseLeave={handleActionBtnContainerMouseLeave}
          >
            <div className="action-btns-container">
              <span className="btn" onClick={handlePinQueryBtnClick}>
                {query.pinnedAt ? t('UNPIN') : t('PIN')}
              </span>
              <span className="btn" onClick={handleEditQueryBtnClick}>
                {t('EDIT')}
              </span>
              <span
                className={`btn delete-btn ${showConfirmDeleteBtn ? 'final-confirm' : ''}`}
                onClick={handleDeleteMemoClick}
                onMouseLeave={handleDeleteBtnMouseLeave}
              >
                {showConfirmDeleteBtn ? t('CONFIRM！') : t('DELETE')}
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default QueryList;
