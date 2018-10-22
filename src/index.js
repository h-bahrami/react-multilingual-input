import React, { Component } from 'react';
import PropTypes from 'prop-types';
import LanguageCodeMapping, { MultiLingualData } from './MultilingualData';
import './styles.css';

class MultilingualInput extends Component {
    constructor(props) {
        super(props);
        this.keepExpanded = false;
        this.state = {
            stayExpanded: false,
            newlang: '',
            newtranslation: '',
        };
        this.handleModalCancel = this.handleModalCancel.bind(this);
        this.handleModalOk = this.handleModalOk.bind(this);
        this.setModalVisibility = (visible = true) => {
            document.getElementById('multilingual_modal_input').style.display = visible ? 'block' : 'none';
        };
        this.generateLanguageOptions = () => {
            const children = [];
            LanguageCodeMapping.forEach((value, key) => {
                children.push(<option value={key}>{value}</option>);
            });
            return children;
        };
    }

    onInputFocusin() {
        this.keepExpanded = true;
        this.setState({ stayExpanded: true });
    }

    onInputFocusout() {
        this.keepExpanded = false;
        setTimeout(() => {
            if (!this.keepExpanded) this.setState({ stayExpanded: false });
        }, 200);
    }

    onTextChange(key, value) {
        const { onInputChange } = this.props;
        onInputChange(key, value);
    }

    onCopy(e) {
        const selection = window.getSelection().toString();
        if (selection === '' || selection === null || selection === undefined) {
            const text = this.getExcelStyleTextFromData();
            e.clipboardData.setData('text/plain', text);
            e.preventDefault();
        }
    }

    onPaste(e) {
        const d = e.clipboardData.getData('text');
        if (this.newRegex().test(d)) {
            e.preventDefault();
            const addToExisting = confirm('Do you want to add the values to the existing ones?');

            const { mldata } = this.props;
            const model = Object.assign({}, mldata);

            const regex = new RegExp(/([a-zA-Z-]+)[\x09|\s]+(.+)[\r|\n|\r\n]/g);
            let match = regex.exec(d);
            while (match) {
                const key = match[1];
                const value = match[2];

                model.values[key] = (addToExisting && model.values[key] !== undefined ? `${model.values[key]} ${value}` : value);
                match = regex.exec(d);
            }
            const { onBatchUpdate } = this.props;
            onBatchUpdate(model);
        }
    }

    getExcelStyleTextFromData() {
        let text = '';
        const { mldata } = this.props;
        Object.keys(mldata.values).forEach((key) => {
            text += `${key}${String.fromCharCode(9)}${mldata.values[key]}\n`;
        });
        return text;
    }

    handleModalCancel() {
        this.setModalVisibility(false);
    }

    handleModalOk() {
        const { newlang, newtranslation } = this.state;
        this.onTextChange(newlang, newtranslation);
        this.setState({ newlang: '', newtranslation: '' });
        this.setModalVisibility(false);
    }

    generateInputs() {
        const { mldata } = this.props;
        const { defaultLanguage } = mldata;
        const defaultValue = mldata.values.get(mldata.defaultLanguage);
        const inputs = [];
        inputs.push(<tr>
            <td>{`${LanguageCodeMapping.get(defaultLanguage)} (${defaultLanguage.toUpperCase()})`}</td>
            <td>{this.generateInput(defaultLanguage, defaultValue)}</td>
            <td><input type="button" value="+" onClick={this.setModalVisibility(true)} /></td>
        </tr>);
        const { stayExpanded } = this.state;
        mldata.values.forEach((value, key) => {
            if (key !== defaultLanguage && stayExpanded) {
                inputs.push(<tr>
                    <td>{`${LanguageCodeMapping.get(key)} (${key.toUpperCase()})`}</td>
                    <td>{this.generateInput(key, value)}</td>
                    <td></td>
                </tr>);
            }
        });
        return inputs;
    }

    generateInput(key, value) {
        return (
            <input
                type="text"
                id={`in_${key}`}
                value={value}
                readOnly={this.props.readOnly}
                minLength={this.props.minLength || 0}
                maxLength={this.props.maxLength || 100}
                onChange={(e) => this.onTextChange(key, e.target.value)}
                onFocus={(e) => this.onInputFocusin(key, e)}
                onBlur={(e) => this.onInputFocusout(key, e)}
                onCopy={(e) => this.onCopy(e)}
                onPaste={(e) => this.onPaste(e)}
                onKeyDown={(e) => {
                    if (e.keyCode === 45) {
                        this.setModalVisibility(true);
                    }
                }}
            />
        );
    }

    render() {
        return (
            <div className="multilingual_container" key={this.props.id}>
                <table key="table">
                    <tbody>
                        {this.generateInputs()}
                    </tbody>
                </table>
                <div key="modal" id="multilingual_modal_input" className="multilingual_modal">
                    <div className="multilingual_modal-content">
                        <span>Add New Value (langauge specific)</span>
                        <select onChange={(val) => this.setState({ newlang: val.target.value })}>
                            {this.generateLanguageOptions()}
                        </select>

                        <br />

                        <input type="text" onChange={(e) => this.setState({ newtranslation: e.target.value })} />

                        <br /><br />

                        <input type="button" key="back" onClick={this.handleModalCancel} value="Cancel"
                            style={{ float: "right", marginLeft: "3px" }} />
                        <input type="button" key="submit" onClick={this.handleModalOk} value="Submit"
                            style={{ float: "right", marginLeft: "3px" }} />
                        <br />
                    </div>
                </div>
            </div>
        );
    }
}


MultilingualInput.propTypes = {
    mldata: MultiLingualData,
    onInputChange: PropTypes.func,
    onBatchUpdate: PropTypes.func
};

MultilingualInput.defaultProps = {
    mldata: new MultiLingualData('fa'),
    onInputChange: null,
    onBatchUpdate: null
};

export default MultilingualInput;
