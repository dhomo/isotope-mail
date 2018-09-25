import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import Spinner from '../spinner/spinner';
import FolderList from './folder-list';
import {moveMessage, resetFolderMessagesCache} from '../../services/message';
import {selectFolder, selectMessage} from '../../actions/application';
import {clearSelected} from '../../actions/messages';
import styles from './folder-container.scss';
import mainCss from '../../styles/main.scss';

class FolderContainer extends Component {
  render() {
    return (
      <nav className={`${mainCss['mdc-list']}`}>
        <Spinner visible={this.props.activeRequests > 0 && this.props.folderList.length === 0}
          canvasClassName={styles.spinnerCanvas} />
        <FolderList folderList={this.props.folderList}
          selectedFolder={this.props.selectedFolder}
          onClickFolder={this.props.selectFolder}
          onDropMessage={this.props.moveMessage}
        />
      </nav>
    );
  }
}

FolderContainer.propTypes = {
  activeRequests: PropTypes.number.isRequired,
  folderList: PropTypes.array.isRequired,
  selectedFolder: PropTypes.object
};

const mapStateToProps = state => ({
  application: state.application,
  activeRequests: state.folders.activeRequests,
  selectedFolder: state.folders.explodedItems[state.application.selectedFolderId] || {},
  folderList: state.folders.items,
  messages: state.messages
});

const mapDispatchToProps = dispatch => ({
  selectFolder: (folder, credentials, cachedFolderMessagesMap) => {
    dispatch(selectFolder(folder));
    dispatch(selectMessage(null));
    dispatch(clearSelected());
    resetFolderMessagesCache(dispatch, credentials, folder);
  },
  moveMessage: (credentials, fromFolder, toFolder, message) => {
    moveMessage(dispatch, credentials, fromFolder, toFolder, message);
  }
});

const mergeProps = (stateProps, dispatchProps, ownProps) => (Object.assign({}, stateProps, dispatchProps, ownProps, {
  selectFolder: folder =>
    dispatchProps.selectFolder(folder, stateProps.application.user.credentials,
      stateProps.messages.cache[folder.folderId]),
  moveMessage: (fromFolder, toFolder, message) => dispatchProps.moveMessage(stateProps.application.user.credentials,
    fromFolder, toFolder, message)
}));

export default connect(mapStateToProps, mapDispatchToProps, mergeProps)(FolderContainer);
